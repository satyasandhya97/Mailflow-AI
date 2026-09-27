import { skipToken } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildDraftPayload,
  buildForwardBody,
  buildForwardSubject,
  buildQuotedBody,
  buildReplySubject,
  canSendEmail,
  composeSnapshotKey,
  extractReplyTo,
  hasComposeContent,
} from "@/features/gmail/lib/gmail-compose.utils";
import { api } from "@/trpc/react";

export type ComposeMode = "reply" | "forward" | null;
export type ComposeSaveStatus = "idle" | "saving" | "saved" | "error";

const AUTO_SAVE_MS = 1500;
const FIRST_SAVE_MS = 800;
const LIST_INVALIDATE_MS = 3000;

function normalizeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function useCompose(options: {
  open: boolean;
  draftId: string | null;
  mode: ComposeMode;
  messageId: string | null;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [loadedComposeKey, setLoadedComposeKey] = useState<string | null>(
    null,
  );
  const [saveStatus, setSaveStatus] = useState<ComposeSaveStatus>("idle");
  const [isSending, setIsSending] = useState(false);

  const activeDraftIdRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  const saveInFlightRef = useRef(false);
  const saveInFlightPromiseRef = useRef<Promise<string | null> | null>(null);
  const pendingSaveRef = useRef(false);
  const locallyAuthoritativeRef = useRef(false);
  const listInvalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const saveDraftRef = useRef<() => Promise<string | null>>(async () => null);

  const utils = api.useUtils();
  const draftQueryId = normalizeId(options.draftId);

  const shouldFetchDraftFromServer =
    !!draftQueryId &&
    !locallyAuthoritativeRef.current &&
    loadedDraftId !== draftQueryId;

  const existingDraft = api.gmail.getDraft.useQuery(
    shouldFetchDraftFromServer ? { id: draftQueryId } : skipToken,
  );

  const replyMessageId = normalizeId(options.messageId);
  const shouldLoadReplySource =
    options.open &&
    !!replyMessageId &&
    !draftQueryId &&
    (options.mode === "reply" || options.mode === "forward");

  const replySource = api.gmail.getMessage.useQuery(
    shouldLoadReplySource ? { id: replyMessageId } : skipToken,
  );

  const resolveExistingDraftId = useCallback(() => {
    return draftQueryId ?? activeDraftIdRef.current;
  }, [draftQueryId]);

  useEffect(() => {
    if (draftQueryId && !locallyAuthoritativeRef.current) {
      activeDraftIdRef.current = draftQueryId;
    }
  }, [draftQueryId]);

  const markSnapshotSaved = useCallback(
    (nextTo: string, nextSubject: string, nextBody: string) => {
      lastSavedSnapshotRef.current = composeSnapshotKey(
        nextTo,
        nextSubject,
        nextBody,
      );
    },
    [],
  );

  const invalidateDraftLists = useCallback(() => {
    void utils.gmail.listDrafts.invalidate();
    void utils.gmail.getDraftCount.invalidate();
  }, [utils]);

  const scheduleListDraftsInvalidate = useCallback(() => {
    if (listInvalidateTimerRef.current) {
      clearTimeout(listInvalidateTimerRef.current);
    }
    listInvalidateTimerRef.current = setTimeout(() => {
      invalidateDraftLists();
      listInvalidateTimerRef.current = null;
    }, LIST_INVALIDATE_MS);
  }, [invalidateDraftLists]);

  const flushListDraftsInvalidate = useCallback(() => {
    if (listInvalidateTimerRef.current) {
      clearTimeout(listInvalidateTimerRef.current);
      listInvalidateTimerRef.current = null;
    }
    invalidateDraftLists();
  }, [invalidateDraftLists]);

  const reset = useCallback(() => {
    setTo("");
    setSubject("");
    setBody("");
    setLoadedDraftId(null);
    setLoadedComposeKey(null);
    activeDraftIdRef.current = null;
    locallyAuthoritativeRef.current = false;
    lastSavedSnapshotRef.current = "";
    setSaveStatus("idle");
    setIsSending(false);
    if (listInvalidateTimerRef.current) {
      clearTimeout(listInvalidateTimerRef.current);
      listInvalidateTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!options.open) {
      reset();
    }
  }, [options.open, reset]);

  useEffect(() => {
    if (!options.open || !draftQueryId) return;
    if (loadedDraftId !== null && loadedDraftId !== draftQueryId) {
      locallyAuthoritativeRef.current = false;
      setLoadedDraftId(null);
    }
  }, [options.open, draftQueryId, loadedDraftId]);

  useEffect(() => {
    if (
      !options.open ||
      !existingDraft.data ||
      !draftQueryId ||
      loadedDraftId === draftQueryId ||
      locallyAuthoritativeRef.current
    ) {
      return;
    }

    setTo(existingDraft.data.to);
    setSubject(existingDraft.data.subject);
    setBody(existingDraft.data.body);
    setLoadedDraftId(draftQueryId);
    activeDraftIdRef.current = draftQueryId;
    markSnapshotSaved(
      existingDraft.data.to,
      existingDraft.data.subject,
      existingDraft.data.body,
    );
    setSaveStatus("saved");
  }, [
    options.open,
    existingDraft.data,
    draftQueryId,
    loadedDraftId,
    markSnapshotSaved,
  ]);

  useEffect(() => {
    if (
      !options.open ||
      !replySource.data ||
      draftQueryId ||
      !options.mode ||
      !replyMessageId
    ) {
      return;
    }

    const composeKey = `${options.mode}:${replyMessageId}`;
    if (loadedComposeKey === composeKey) return;

    const message = replySource.data;
    let nextTo = "";
    let nextSubject = "";
    let nextBody = "";

    if (options.mode === "reply") {
      nextTo = extractReplyTo(message.from);
      nextSubject = buildReplySubject(message.subject);
      nextBody = buildQuotedBody(
        message.body || message.snippet,
        message.from,
        message.date,
      );
    } else {
      nextSubject = buildForwardSubject(message.subject);
      nextBody = buildForwardBody(
        message.body || message.snippet,
        message.from,
        message.to,
        message.subject,
        message.date,
      );
    }

    setTo(nextTo);
    setSubject(nextSubject);
    setBody(nextBody);
    setLoadedComposeKey(composeKey);
    markSnapshotSaved(nextTo, nextSubject, nextBody);
  }, [
    options.open,
    replySource.data,
    draftQueryId,
    options.mode,
    replyMessageId,
    loadedComposeKey,
    markSnapshotSaved,
  ]);

  const invalidateAfterSend = async () => {
    await utils.gmail.searchEmails.invalidate();
    await utils.gmail.listSent.invalidate();
    await utils.gmail.listDrafts.invalidate();
    await utils.gmail.getDraftCount.invalidate();
    await utils.gmail.getMessageWithThread.invalidate();
  };

  const createDraft = api.gmail.createDraft.useMutation({
    onSuccess: () => {
      scheduleListDraftsInvalidate();
    },
  });

  const updateDraft = api.gmail.updateDraft.useMutation({
    onSuccess: () => {
      scheduleListDraftsInvalidate();
    },
  });

  const sendEmail = api.gmail.sendEmail.useMutation({
    onSuccess: async () => {
      await invalidateAfterSend();
      reset();
    },
  });

  const sendDraft = api.gmail.sendDraft.useMutation({
    onSuccess: async () => {
      await invalidateAfterSend();
      reset();
    },
  });

  const deleteDraft = api.gmail.deleteDraft.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.gmail.listDrafts.invalidate(),
        utils.gmail.getDraftCount.invalidate(),
        utils.gmail.getDraft.invalidate({ id: variables.id }),
      ]);
    },
  });

  const isDirty = useCallback(() => {
    return (
      composeSnapshotKey(to, subject, body) !== lastSavedSnapshotRef.current
    );
  }, [to, subject, body]);

  const runSaveDraft = useCallback(async (): Promise<string | null> => {
    if (!options.open) {
      return resolveExistingDraftId();
    }

    if (!hasComposeContent(to, subject, body)) {
      return resolveExistingDraftId();
    }

    if (!isDirty()) {
      return resolveExistingDraftId();
    }

    saveInFlightRef.current = true;
    setSaveStatus("saving");

    const payload = buildDraftPayload(to, subject, body);

    try {
      const existingId = resolveExistingDraftId();
      if (existingId) {
        await updateDraft.mutateAsync({ id: existingId, ...payload });
        activeDraftIdRef.current = existingId;
        setLoadedDraftId(existingId);
        locallyAuthoritativeRef.current = true;
        markSnapshotSaved(to, subject, body);
        setSaveStatus("saved");
        return existingId;
      }

      const created = await createDraft.mutateAsync(payload);
      if (created.id) {
        activeDraftIdRef.current = created.id;
        setLoadedDraftId(created.id);
        locallyAuthoritativeRef.current = true;
        markSnapshotSaved(to, subject, body);
        setSaveStatus("saved");
        return created.id;
      }

      setSaveStatus("error");
      return null;
    } catch {
      setSaveStatus("error");
      return resolveExistingDraftId();
    } finally {
      saveInFlightRef.current = false;
      saveInFlightPromiseRef.current = null;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void saveDraftRef.current();
      }
    }
  }, [
    options.open,
    to,
    subject,
    body,
    isDirty,
    updateDraft,
    createDraft,
    markSnapshotSaved,
    resolveExistingDraftId,
  ]);

  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (saveInFlightRef.current && saveInFlightPromiseRef.current) {
      pendingSaveRef.current = true;
      return saveInFlightPromiseRef.current;
    }

    const promise = runSaveDraft();
    saveInFlightPromiseRef.current = promise;
    return promise;
  }, [runSaveDraft]);

  saveDraftRef.current = saveDraft;

  const sendMessage = useCallback(async () => {
    if (!canSendEmail(to, body) || isSending) return;

    setIsSending(true);
    try {
      await sendEmail.mutateAsync({
        to: to.trim(),
        subject: subject.trim() || "(no subject)",
        body: body.trim(),
      });

      const draftToDelete = resolveExistingDraftId();
      if (draftToDelete) {
        void deleteDraft.mutate({ id: draftToDelete });
      }
    } catch {
      setIsSending(false);
    }
  }, [
    to,
    subject,
    body,
    isSending,
    sendEmail,
    deleteDraft,
    resolveExistingDraftId,
  ]);

  const isLoadingPrefill =
    options.open &&
    ((shouldFetchDraftFromServer &&
      existingDraft.isLoading &&
      !existingDraft.data) ||
      (shouldLoadReplySource &&
        replySource.isLoading &&
        !replySource.data));

  useEffect(() => {
    if (!options.open) return;
    if (isLoadingPrefill) return;
    if (!hasComposeContent(to, subject, body)) return;
    if (composeSnapshotKey(to, subject, body) === lastSavedSnapshotRef.current) {
      return;
    }

    const delay = resolveExistingDraftId() ? AUTO_SAVE_MS : FIRST_SAVE_MS;
    const timer = window.setTimeout(() => {
      void saveDraft();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    options.open,
    to,
    subject,
    body,
    saveDraft,
    isLoadingPrefill,
    resolveExistingDraftId,
  ]);

  const activeDraftId = resolveExistingDraftId();
  const isSaving =
    saveStatus === "saving" ||
    createDraft.isPending ||
    updateDraft.isPending;

  return {
    to,
    setTo,
    subject,
    setSubject,
    body,
    setBody,
    createDraft,
    updateDraft,
    sendEmail,
    sendDraft,
    deleteDraft,
    saveDraft,
    sendMessage,
    reset,
    flushListDraftsInvalidate,
    saveStatus,
    isSaving,
    isSending,
    activeDraftId,
    mode: options.mode,
    isEditing: !!activeDraftId,
    isLoadingDraft: isLoadingPrefill,
    hasContent: hasComposeContent(to, subject, body),
    canSend: canSendEmail(to, body),
    isDirty: isDirty(),
  };
}

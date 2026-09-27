import { Suspense } from "react";

import { PluginsPageView } from "@/features/plugins/components/plugins-page-view";

export default function PluginsPage() {
  return (
    <Suspense fallback={null}>
      <PluginsPageView />
    </Suspense>
  );
}

import { forwardRef } from "react";

export const SearchBar = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onClear: () => void;
    placeholder?: string;
  }
>(function SearchBar(
  { value, onChange, onSubmit, onClear, placeholder = "search" },
  ref,
) {
  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <p>
        <button type="submit">search</button>{" "}
        <button type="button" onClick={onClear}>clear</button>
      </p>
    </form>
  );
});

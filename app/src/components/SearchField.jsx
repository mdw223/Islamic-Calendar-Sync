/**
 * SearchField.jsx
 *
 * A reusable compact search input with a clear button.
 *
 * Props:
 *   value    — controlled input value
 *   onChange — (newValue: string) => void
 *   placeholder — input placeholder text (default: "Search…")
 *   ...rest  — forwarded to the MUI TextField
 */

import { InputAdornment, TextField } from "@mui/material";
import { Search as SearchIcon, X as ClearIcon } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import DOMPurify from "dompurify";

export default function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  ...rest
}) {
  return (
    <TextField
      size="small"
      variant="outlined"
      placeholder={placeholder}
      value={value}
      onChange={(e) =>
        onChange(DOMPurify.sanitize(e.target.value, { ALLOWED_TAGS: [] }))
      }
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon size={14} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => onChange("")}
                edge="end"
                aria-label="Clear search"
                sx={{ p: 0.25 }}
              >
                <ClearIcon size={14} />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          fontSize: "0.8rem",
        },
        ...rest.sx,
      }}
      {...rest}
      // override sx after spread so our styles win
    />
  );
}

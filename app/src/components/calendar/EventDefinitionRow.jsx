/**
 * EventDefinitionRow.jsx
 *
 * Renders one checkbox + bilingual label row for an Islamic event definition.
 */

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  ListItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useOptionalUser } from "../../contexts/UserContext";

const SWATCH_COLORS = [
  "#2E7D32",
  "#0288D1",
  "#F59E0B",
  "#7C3AED",
  "#C62828",
  "#00897B",
  "#6D4C41",
  "#546E7A",
];

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

/**
 * @param {{ definition: Object, checked: boolean, onChange: Function, onColorChange?: Function, allowColorChange?: boolean }} props
 */
export default function EventDefinitionRow({
  definition,
  checked,
  onChange,
  onColorChange,
  allowColorChange = true,
}) {
  const { user } = useOptionalUser();
  const showArabicEventText = user?.showArabicEventText !== false;
  const hasArabicTitle = showArabicEventText && Boolean(definition.titleAr);
  const rowAlignItems = hasArabicTitle ? "flex-start" : "center";

  const [anchorEl, setAnchorEl] = useState(null);
  const [draftColor, setDraftColor] = useState(definition.defaultColor ?? "#7C3AED");

  const effectiveColor = useMemo(
    () => definition.defaultColor ?? "#7C3AED",
    [definition.defaultColor],
  );

  const pickerOpen = Boolean(anchorEl);

  function openPicker(event) {
    setDraftColor(effectiveColor);
    setAnchorEl(event.currentTarget);
  }

  function closePicker() {
    setAnchorEl(null);
  }

  function submitColor() {
    if (!HEX_COLOR_RE.test(draftColor)) return;
    onColorChange?.(definition.id, draftColor.toUpperCase());
    closePicker();
  }

  return (
    <ListItem
      disableGutters
      sx={{ py: 0.25, px: 1, display: "flex", alignItems: rowAlignItems }}
    >
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={checked}
            onChange={(e) => onChange(definition.id, e.target.checked)}
            sx={{ py: 0.5 }}
          />
        }
        label={
          <Box>
            {hasArabicTitle && (
              <Typography
                variant="caption"
                component="div"
                dir="rtl"
                sx={{ fontWeight: 600, lineHeight: 1.3, color: "text.primary" }}
              >
                {definition.titleAr}
              </Typography>
            )}
            <Typography
              variant="caption"
              component="div"
              sx={{
                color: hasArabicTitle ? "text.secondary" : "text.primary",
                lineHeight: 1.2,
              }}
            >
              {definition.titleEn}
            </Typography>
          </Box>
        }
        sx={{ m: 0, alignItems: rowAlignItems }}
      />

      {allowColorChange && (
        <>
          <Box
            sx={{
              ml: "auto",
              mr: { xs: 2, sm: 0 },
              pt: hasArabicTitle ? 0.5 : 0,
            }}
          >
            <Tooltip title="Change definition color">
              <IconButton
                size="small"
                onClick={openPicker}
                aria-label={`Change color for ${definition.titleEn}`}
              >
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: effectiveColor,
                    border: 1,
                    borderColor: "divider",
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>

          <Popover
            open={pickerOpen}
            anchorEl={anchorEl}
            onClose={closePicker}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ p: 1.5, width: 220 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Definition color
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, mb: 1.25, flexWrap: "wrap" }}>
                {SWATCH_COLORS.map((color) => (
                  <IconButton
                    key={color}
                    size="small"
                    onClick={() => setDraftColor(color)}
                    aria-label={`Use color ${color}`}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        bgcolor: color,
                        border: draftColor.toUpperCase() === color ? 2 : 1,
                        borderColor:
                          draftColor.toUpperCase() === color ? "text.primary" : "divider",
                      }}
                    />
                  </IconButton>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <input
                  type="color"
                  value={HEX_COLOR_RE.test(draftColor) ? draftColor : "#7C3AED"}
                  onChange={(e) => setDraftColor(e.target.value.toUpperCase())}
                  aria-label="Pick custom color"
                />
                <TextField
                  size="small"
                  value={draftColor}
                  onChange={(e) => setDraftColor(e.target.value)}
                  error={!HEX_COLOR_RE.test(draftColor)}
                  helperText={!HEX_COLOR_RE.test(draftColor) ? "Use #RRGGBB" : " "}
                />
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                <Button size="small" onClick={closePicker}>Cancel</Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={submitColor}
                  disabled={!HEX_COLOR_RE.test(draftColor)}
                >
                  Apply
                </Button>
              </Stack>
            </Box>
          </Popover>
        </>
      )}
    </ListItem>
  );
}

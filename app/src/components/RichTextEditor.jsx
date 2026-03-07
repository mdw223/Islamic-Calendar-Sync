/**
 * RichTextEditor.jsx
 *
 * A feature-rich Lexical-based rich text editor for event descriptions.
 *
 * Features:
 *   - Bold, Italic, Underline, Strikethrough
 *   - Bullet & Numbered lists
 *   - Speech-to-Text (Web Speech API)
 *   - Convert from Markdown
 *   - Import file (.html, .md, .txt)
 *   - Export as HTML
 *   - Share (Web Share API → clipboard fallback)
 *   - Clear content
 *   - Read-only mode toggle
 *
 * Props:
 *   value       — HTML string (controlled)
 *   onChange     — (html: string) => void
 *   readOnly    — external read-only override (optional)
 *   placeholder — placeholder text (default: "Add a description…")
 *   minHeight   — editor min-height in px (default: 120)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Mic,
  MicOff,
  FileDown,
  FileUp,
  Share2,
  Trash2,
  Eye,
  EyeOff,
  ALargeSmall,
} from "lucide-react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListNode, ListItemNode } from "@lexical/list";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { TRANSFORMERS, $convertFromMarkdownString } from "@lexical/markdown";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";

import DOMPurify from "dompurify";

// ── Theme (CSS class map for Lexical nodes) ──────────────────────────────
const editorTheme = {
  text: {
    bold: "rte-bold",
    italic: "rte-italic",
    underline: "rte-underline",
    strikethrough: "rte-strikethrough",
  },
  list: {
    ul: "rte-ul",
    ol: "rte-ol",
    listitem: "rte-li",
  },
};

// ── Inline styles injected once ──────────────────────────────────────────
const STYLE_ID = "rte-lexical-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .rte-bold { font-weight: 700; }
    .rte-italic { font-style: italic; }
    .rte-underline { text-decoration: underline; }
    .rte-strikethrough { text-decoration: line-through; }
    .rte-ul { list-style: disc; padding-left: 1.5em; margin: 0.25em 0; }
    .rte-ol { list-style: decimal; padding-left: 1.5em; margin: 0.25em 0; }
    .rte-li { margin: 0.125em 0; }
    .rte-placeholder {
      color: #999;
      position: absolute;
      top: 8px;
      left: 12px;
      pointer-events: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}
injectStyles();

// ── Synchronise external `value` prop → editor ──────────────────────────
// Skip re-importing HTML that the editor itself just emitted (avoids cursor reset).
function HtmlSyncPlugin({ value, lastEmittedRef }) {
  const [editor] = useLexicalComposerContext();
  const lastPushed = useRef();

  useEffect(() => {
    // If the incoming value matches what we last emitted via onChange,
    // it's just the round-trip echo — ignore it.
    if (value === lastEmittedRef.current) return;
    if (value === lastPushed.current) return;
    lastPushed.current = value;

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      if (!value) {
        root.append($createParagraphNode());
        return;
      }

      const incoming = String(value);
      const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(incoming);

      if (!looksLikeHtml) {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(incoming));
        root.append(paragraph);
        return;
      }

      const cleanHtml = DOMPurify.sanitize(incoming);
      const dom = new DOMParser().parseFromString(cleanHtml, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);

      if (nodes.length === 0) {
        root.append($createParagraphNode());
        return;
      }

      // Insert through selection so Lexical normalizes top-level nodes safely.
      root.select();
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes(nodes);
      } else {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(incoming));
        root.append(paragraph);
      }
    });
  }, [editor, value, lastEmittedRef]);

  return null;
}

// ── Read-only sync plugin ────────────────────────────────────────────────
function ReadOnlyPlugin({ readOnly }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);
  return null;
}

// ── Toolbar ──────────────────────────────────────────────────────────────
function Toolbar({
  editorRef,
  isReadOnly,
  onToggleReadOnly,
  onClear,
  onExport,
  onImport,
  onShare,
  isListening,
  onToggleSpeech,
  onConvertMarkdown,
  speechSupported,
}) {
  const [editor] = useLexicalComposerContext();

  // Store editor ref so parent can access it.
  useEffect(() => {
    editorRef.current = editor;
  }, [editor, editorRef]);

  const fmt = (type) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);

  const btn = (title, icon, action, active, disabled) => (
    <Tooltip title={title} key={title}>
      <span>
        <IconButton
          size="small"
          onClick={action}
          disabled={disabled}
          sx={{
            color: active ? "primary.main" : "text.secondary",
            borderRadius: 1,
            p: 0.5,
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.25,
        alignItems: "center",
        px: 0.5,
        py: 0.25,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "action.hover",
      }}
    >
      {/* Formatting */}
      {btn("Bold", <Bold size={15} />, () => fmt("bold"), false, isReadOnly)}
      {btn(
        "Italic",
        <Italic size={15} />,
        () => fmt("italic"),
        false,
        isReadOnly,
      )}
      {btn(
        "Underline",
        <Underline size={15} />,
        () => fmt("underline"),
        false,
        isReadOnly,
      )}
      {btn(
        "Strikethrough",
        <Strikethrough size={15} />,
        () => fmt("strikethrough"),
        false,
        isReadOnly,
      )}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Lists */}
      {btn(
        "Bullet List",
        <List size={15} />,
        () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
        false,
        isReadOnly,
      )}
      {btn(
        "Numbered List",
        <ListOrdered size={15} />,
        () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
        false,
        isReadOnly,
      )}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Extended features */}
      {speechSupported &&
        btn(
          isListening ? "Stop Listening" : "Speech to Text",
          isListening ? <MicOff size={15} /> : <Mic size={15} />,
          onToggleSpeech,
          isListening,
          isReadOnly,
        )}
      {btn(
        "Convert from Markdown",
        <ALargeSmall size={15} />,
        onConvertMarkdown,
        false,
        isReadOnly,
      )}
      {btn("Import File", <FileUp size={15} />, onImport, false, isReadOnly)}

      <Box sx={{ flex: 1 }} />

      {btn("Export HTML", <FileDown size={15} />, onExport, false, false)}
      {btn("Share", <Share2 size={15} />, onShare, false, false)}
      {btn("Clear", <Trash2 size={15} />, onClear, false, isReadOnly)}
      {btn(
        isReadOnly ? "Edit Mode" : "Read Mode",
        isReadOnly ? <EyeOff size={15} /> : <Eye size={15} />,
        onToggleReadOnly,
        isReadOnly,
        false,
      )}
    </Box>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function RichTextEditor({
  value = "",
  onChange,
  readOnly: externalReadOnly,
  placeholder = "Add a description…",
  minHeight = 120,
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastEmittedRef = useRef(null);
  const [internalReadOnly, setInternalReadOnly] = useState(false);
  const isReadOnly = externalReadOnly ?? internalReadOnly;

  // ── Speech-to-Text ────────────────────────────────────────────────────
  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const toggleSpeech = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (!transcript) return;

      const editor = editorRef.current;
      if (!editor) return;
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(transcript);
        } else {
          const root = $getRoot();
          const p = $createParagraphNode();
          p.append($createTextNode(transcript));
          root.append(p);
        }
      });
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Cleanup recognition on unmount.
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  // ── Convert from Markdown ─────────────────────────────────────────────
  const convertMarkdown = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.update(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      root.clear();
      $convertFromMarkdownString(text, TRANSFORMERS);
    });
  }, []);

  // ── Import file ───────────────────────────────────────────────────────
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result;
      const editor = editorRef.current;
      if (!editor) return;

      editor.update(() => {
        const root = $getRoot();
        root.clear();

        if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
          $convertFromMarkdownString(raw, TRANSFORMERS);
        } else {
          // Treat as HTML.
          const clean = DOMPurify.sanitize(raw);
          const dom = new DOMParser().parseFromString(clean, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          for (const n of nodes) root.append(n);
        }
      });
    };
    reader.readAsText(file);

    // Reset so the same file can be re-imported.
    e.target.value = "";
  }, []);

  // ── Export HTML ───────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.update(() => {
      const html = $generateHtmlFromNodes(editor);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "description.html";
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  // ── Share ─────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.update(() => {
      const html = $generateHtmlFromNodes(editor);
      const plainText = $getRoot().getTextContent();

      if (navigator.share) {
        navigator
          .share({ title: "Event Description", text: plainText })
          .catch(() => {});
      } else {
        navigator.clipboard
          .writeText(plainText)
          .then(() => alert("Copied to clipboard!"))
          .catch(() => alert("Failed to copy."));
      }
    });
  }, []);

  // ── Clear ─────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      root.append($createParagraphNode());
    });
  }, []);

  // ── Read-only toggle ──────────────────────────────────────────────────
  const toggleReadOnly = useCallback(() => {
    setInternalReadOnly((prev) => !prev);
  }, []);

  // ── Lexical onChange → parent ─────────────────────────────────────────
  const handleEditorChange = useCallback(
    (editorState) => {
      if (!onChange) return;
      const editor = editorRef.current;
      if (!editor) return;

      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor);
        // Treat empty editor as blank.
        const isEmpty = html === "<p><br></p>" || html === "<p></p>";
        const clean = isEmpty ? "" : DOMPurify.sanitize(html);
        // Track what we emitted so HtmlSyncPlugin won't re-import it.
        lastEmittedRef.current = clean;
        onChange(clean);
      });
    },
    [onChange],
  );

  // ── Lexical initial config ────────────────────────────────────────────
  const initialConfig = {
    namespace: "RichTextEditor",
    theme: editorTheme,
    nodes: [ListNode, ListItemNode],
    editable: !isReadOnly,
    onError: (error) => console.error("Lexical error:", error),
  };

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        opacity: isReadOnly ? 0.85 : 1,
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar
          editorRef={editorRef}
          isReadOnly={isReadOnly}
          onToggleReadOnly={
            externalReadOnly === undefined ? toggleReadOnly : undefined
          }
          onClear={handleClear}
          onExport={handleExport}
          onImport={handleImport}
          onShare={handleShare}
          isListening={isListening}
          onToggleSpeech={toggleSpeech}
          onConvertMarkdown={convertMarkdown}
          speechSupported={speechSupported}
        />

        <Box sx={{ position: "relative", minHeight, px: 1.5, py: 1 }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{
                  outline: "none",
                  minHeight: `${minHeight - 16}px`,
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                }}
              />
            }
            placeholder={
              <Typography
                variant="body2"
                className="rte-placeholder"
                sx={{ position: "absolute", top: 8, left: 12 }}
              >
                {placeholder}
              </Typography>
            }
          />
          <HistoryPlugin />
          <ListPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <HtmlSyncPlugin value={value} lastEmittedRef={lastEmittedRef} />
          <ReadOnlyPlugin readOnly={isReadOnly} />
        </Box>
      </LexicalComposer>

      {/* Hidden file input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.md,.txt"
        style={{ display: "none" }}
        onChange={onFileSelected}
      />
    </Box>
  );
}

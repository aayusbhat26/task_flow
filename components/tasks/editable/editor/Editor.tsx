"use client";

import { useEditor, BubbleMenu, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { ToolsContainer } from "./tools/ToolsContainer";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { StaticToolbar } from "./tools/StaticToolbar";
import { useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";
import { useAutosaveIndicator } from "@/context/AutosaveIndicator";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const limit = 600;

interface Props {
  content?: JSON;
  taskId: string;
  workspaceId: string;
}

export const EditorTasks = ({ content, taskId, workspaceId }: Props) => {
  const t = useTranslations("TASK");
  const { onSetStatus, status } = useAutosaveIndicator();
  const editor = useEditor({
    editorProps: {
      handleDrop: () => {
        return false;
      },
      attributes: {
        class:
          "focus:outline-none prose prose-stone dark:prose-invert min-h-[220px] w-full max-w-none rounded-sm focus-visible:outline-none prose-headings:font-display prose-headings:font-normal prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:text-foreground prose-blockquote:border-l-primary prose-blockquote:font-display prose-blockquote:text-lg prose-blockquote:not-italic prose-ol:text-foreground/90 prose-ul:text-foreground/90 prose-li:marker:text-muted-foreground prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-h5:text-lg prose-h6:text-base prose-p:text-[15px] prose-p:leading-7 prose-p:my-2",
      },
    },
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: () => {
      if (status !== "unsaved") onSetStatus("unsaved");
      debouncedEditor();
    },
    onBlur: () => {
      debouncedEditor.flush();
    },
    extensions: [
      StarterKit.configure({
        dropcursor: {
          class: "text-primary",
        },
      }),
      Underline,
      Link,
      Color,
      TextStyle,
      Image,
      CharacterCount.configure({
        limit,
      }),
      Placeholder.configure({
        emptyNodeClass: "before:text-muted-foreground",
        placeholder: t("EDITOR.PLACEHOLDER"),
      }),
    ],
    content: content ? content : ``,
  });

  const { mutate: updateTaskContent } = useMutation({
    mutationFn: async (content: JSON) => {
      await axios.post(`/api/task/update/content`, {
        workspaceId,
        content,
        taskId,
      });
    },
    onSuccess: () => {
      onSetStatus("saved");
    },
    onError: () => {
      onSetStatus("unsaved");
    },
  });

  const debouncedEditor = useDebouncedCallback(() => {
    onSetStatus("pending");
    const json = editor?.state.doc.toJSON() as JSON;
    updateTaskContent(json);
  }, 1000);

  return (
    <div>
      {editor && (
        <>
          <StaticToolbar editor={editor} />
          <BubbleMenu
            editor={editor}
            tippyOptions={{ zIndex: 20, maxWidth: 10000 }}
            className="bg-transparent"
          >
            <ToolsContainer editor={editor} />
          </BubbleMenu>
        </>
      )}
      <EditorContent spellCheck={false} editor={editor} />
      {editor && (
        <div className="mt-10 flex items-center justify-end gap-3 border-t border-border pt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
          <span>
            {t("EDITOR.WORDS")} {editor.storage.characterCount.words()}
          </span>
          <span>
            {editor.storage.characterCount.characters()}/{limit}{" "}
            {t("EDITOR.CHARS")}
          </span>
        </div>
      )}
    </div>
  );
};

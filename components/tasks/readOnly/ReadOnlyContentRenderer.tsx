"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";

interface Props {
  content?: JSON;
}

export const ReadOnlyContentRenderer = ({ content }: Props) => {
  const editor = useEditor({
    editorProps: {
      handleDrop: () => {
        return false;
      },
      attributes: {
        class:
          "focus:outline-none prose prose-stone dark:prose-invert w-full max-w-none rounded-sm focus-visible:outline-none prose-headings:font-display prose-headings:font-normal prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-normal prose-code:text-foreground prose-blockquote:border-l-primary prose-blockquote:font-display prose-blockquote:text-lg prose-blockquote:not-italic prose-ol:text-foreground/90 prose-ul:text-foreground/90 prose-li:marker:text-muted-foreground prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-h5:text-lg prose-h6:text-base prose-p:text-[15px] prose-p:leading-7 prose-p:my-2",
      },
    },
    editable: false, // Make it read-only
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
    ],
    content: content ? content : ``,
  });

  if (!editor) {
    return null;
  }

  // Check if content is empty
  const isEmpty = !content || (typeof content === 'object' && Object.keys(content).length === 0);

  if (isEmpty) {
    return (
      <div className="flex min-h-[160px] w-full items-start text-muted-foreground">
        <p className="text-[13px]">
          No description yet. Open the task to add context, notes or a
          checklist.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
};

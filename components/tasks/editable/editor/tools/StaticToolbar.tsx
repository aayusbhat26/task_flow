"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { OptionBtn } from "./btn/OptionBtn";
import { AddLink } from "./AddLink";
import { AddImage } from "./addImage/AddImage";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Props {
  editor: Editor;
}

export const StaticToolbar = ({ editor }: Props) => {
  const t = useTranslations("TASK.EDITOR.HOVER");

  const buttonClass = (active: boolean) =>
    cn(active && "bg-secondary text-foreground");

  return (
    <div className="mb-5 flex items-center gap-0.5 overflow-x-auto border-y border-border py-1.5 no-scrollbar">
      <OptionBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
        hoverText={t("H1")}
      >
        <Heading1 size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
        hoverText={t("H2")}
      >
        <Heading2 size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive("bold"))}
        hoverText={t("BOLD")}
      >
        <Bold size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive("italic"))}
        hoverText={t("ITALIC")}
      >
        <Italic size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive("underline"))}
        hoverText={t("UNDERLINE")}
      >
        <UnderlineIcon size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive("strike"))}
        hoverText={t("STRIKETHROUGH")}
      >
        <Strikethrough size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={buttonClass(editor.isActive("code"))}
        hoverText={t("CODE")}
      >
        <Code size={15} />
      </OptionBtn>
      <span className="mx-1 h-4 w-px bg-border" />
      <OptionBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive("bulletList"))}
        hoverText={t("UL")}
      >
        <List size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive("orderedList"))}
        hoverText={t("OL")}
      >
        <ListOrdered size={15} />
      </OptionBtn>
      <OptionBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive("blockquote"))}
        hoverText="Quote"
      >
        <Quote size={15} />
      </OptionBtn>
      <span className="mx-1 h-4 w-px bg-border" />
      <AddLink editor={editor} />
      <AddImage editor={editor} />
      <span className="mx-1 h-4 w-px bg-border" />
      <OptionBtn onClick={() => editor.commands.undo()} hoverText={t("UNDO")}>
        <Undo2 size={15} />
      </OptionBtn>
      <OptionBtn onClick={() => editor.commands.redo()} hoverText={t("REDO")}>
        <Redo2 size={15} />
      </OptionBtn>
    </div>
  );
};

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'
import { cn } from '../lib/utils.js'
import { Bold, Italic, List, ListOrdered, Heading2, Code, Quote } from 'lucide-react'

import { marked } from 'marked'

// Helper: convert markdown to basic HTML for TipTap initial load
function markdownToHtml(md) {
  if (!md) return ''
  // If it's already HTML (e.g. from a saved TipTap edit), don't parse it
  if (md.trim().startsWith('<') && md.trim().endsWith('>')) return md

  // Use marked for robust parsing of AI markdown
  return marked.parse(md, { breaks: true })
}

export default function TipTapEditor({ content, onUpdate, readOnly = false, placeholder = 'Summary will appear here…' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: { HTMLAttributes: { class: 'tiptap-code-block' } },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content ? markdownToHtml(content) : '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'tiptap focus:outline-none' },
    },
  })

  // When content changes externally (e.g., after stream completes), reload editor
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const currentHtml = editor.getHTML()
    const newHtml = content ? markdownToHtml(content) : ''
    if (newHtml !== currentHtml && newHtml) {
      editor.commands.setContent(newHtml, false)
    }
  }, [content, editor])

  const ToolbarButton = useCallback(({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-all duration-100 border-0 cursor-pointer',
        active
          ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300'
          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 bg-transparent'
      )}
    >
      {children}
    </button>
  ), [])

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className={cn(
          'flex items-center gap-0.5 px-3 py-2 border-b',
          'border-surface-200 dark:border-surface-700',
          'bg-surface-50 dark:bg-surface-900 rounded-t-xl'
        )}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={15} />
          </ToolbarButton>
          <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline Code"
          >
            <Code size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote size={15} />
          </ToolbarButton>
        </div>
      )}
      <div className={cn(
        'flex-1 overflow-y-auto px-6 py-5',
        'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
        'prose-p:my-2 prose-headings:mt-5 prose-headings:mb-2 prose-ul:my-2 prose-li:my-0.5',
        readOnly ? 'rounded-xl' : 'rounded-b-xl'
      )}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

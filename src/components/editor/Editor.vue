<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import { Table as TableExtension } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue?: Record<string, unknown> | null
    placeholder?: string
  }>(),
  {
    modelValue: null,
    placeholder: 'Start writing, or press "/" for commands…',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  save: [value: Record<string, unknown>]
}>()

// shallowRef: the Editor is a complex class instance that tiptap mutates
// internally — deep reactivity would be wasteful and breaks its type.
const editor = shallowRef<Editor | null>(null)
const editorForContent = computed<Editor | undefined>(() => editor.value ?? undefined)
let saveTimer: number | undefined

function createEditor() {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({ placeholder: () => props.placeholder }),
      Underline,
      Link.configure({ protocols: ['http', 'https', 'mailto'] }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: (props.modelValue as object) ?? '',
    editorProps: {
      attributes: {
        class: 'prose-editor',
        'aria-label': 'Page content editor',
      },
    },
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON() as Record<string, unknown>
      emit('update:modelValue', json)
      // Debounced autosave (Workflow §33) — coalesce rapid keystrokes.
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => emit('save', json), 800)
    },
  })
}

createEditor()

watch(
  () => props.modelValue,
  (next) => {
    const current = editor.value?.getJSON()
    // Only push external content in when it actually differs, to avoid
    // resetting the cursor while the user is typing.
    if (next && JSON.stringify(next) !== JSON.stringify(current)) {
      editor.value?.commands.setContent(next as object, { emitUpdate: false })
    }
  },
)

onBeforeUnmount(() => {
  window.clearTimeout(saveTimer)
  editor.value?.destroy()
})

function setLink() {
  if (!editor.value) return
  const previous = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('Link URL', previous ?? 'https://')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<template>
  <div class="editor">
    <div
      v-if="editor"
      class="toolbar"
      role="toolbar"
      aria-label="Formatting"
    >
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('heading', { level: 1 }) }"
        title="Heading 1"
        aria-label="Heading 1"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <Heading1 :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('heading', { level: 2 }) }"
        title="Heading 2"
        aria-label="Heading 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <Heading2 :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('heading', { level: 3 }) }"
        title="Heading 3"
        aria-label="Heading 3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <Heading3 :size="15" />
      </button>

      <span class="toolbar__sep" />

      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('bold') }"
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <Bold :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('italic') }"
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <Italic :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('underline') }"
        title="Underline (Ctrl+U)"
        aria-label="Underline"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <UnderlineIcon :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('strike') }"
        title="Strikethrough"
        aria-label="Strikethrough"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <Strikethrough :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('link') }"
        title="Link"
        aria-label="Insert link"
        @click="setLink"
      >
        <span class="tool__text">Link</span>
      </button>

      <span class="toolbar__sep" />

      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('bulletList') }"
        title="Bullet list"
        aria-label="Bullet list"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <List :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('orderedList') }"
        title="Numbered list"
        aria-label="Numbered list"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <ListOrdered :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('taskList') }"
        title="Task list"
        aria-label="Task list"
        @click="editor.chain().focus().toggleTaskList().run()"
      >
        <ListChecks :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('blockquote') }"
        title="Quote"
        aria-label="Quote"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <Quote :size="15" />
      </button>
      <button
        class="tool"
        title="Divider"
        aria-label="Divider"
        @click="editor.chain().focus().setHorizontalRule().run()"
      >
        <Minus :size="15" />
      </button>
      <button
        class="tool"
        :class="{ 'tool--active': editor.isActive('codeBlock') }"
        title="Code block"
        aria-label="Code block"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        <Code :size="15" />
      </button>

      <span class="toolbar__sep" />

      <button
        class="tool"
        title="Undo"
        aria-label="Undo"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        <Undo :size="15" />
      </button>
      <button
        class="tool"
        title="Redo"
        aria-label="Redo"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        <Redo :size="15" />
      </button>
    </div>

    <EditorContent :editor="editorForContent" />
  </div>
</template>

<style scoped>
.editor {
  min-width: 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1px;
  padding: var(--space-1);
  margin-bottom: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  position: sticky;
  top: var(--space-2);
  z-index: 10;
}

.tool {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-width: 30px;
  height: 28px;
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.tool:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.tool:disabled {
  opacity: 0.4;
  cursor: default;
}

.tool--active {
  background: var(--accent-soft);
  color: var(--accent-text);
}

.tool__text {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.toolbar__sep {
  width: 1px;
  height: 16px;
  background: var(--border);
  margin: 0 var(--space-1);
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
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
  Columns3,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Rows3,
  Strikethrough,
  Table,
  Trash2,
  Underline as UnderlineIcon,
  Undo,
  X,
} from 'lucide-vue-next'
import { Callout } from './callout'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import { uploadPageImage } from '@/services/supabase/storage'
import { looksLikeMarkdown, markdownToTiptap } from '@/lib/markdownToTiptap'

const props = withDefaults(
  defineProps<{
    modelValue?: Record<string, unknown> | null
    placeholder?: string
    /** Read-only rendering (public page view). */
    editable?: boolean
  }>(),
  {
    modelValue: null,
    placeholder: 'Start writing…',
    editable: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  save: [value: Record<string, unknown>]
}>()

const auth = useAuthStore()
const toasts = useToasts()

// shallowRef: the Editor is a complex class instance that tiptap mutates
// internally — deep reactivity would be wasteful and breaks its type.
const editor = shallowRef<Editor | null>(null)
const editorForContent = computed<Editor | undefined>(() => editor.value ?? undefined)
let saveTimer: number | undefined

function createEditor() {
  editor.value = new Editor({
    editable: props.editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({
        placeholder: () => props.placeholder,
        showOnlyWhenEditable: true,
      }),
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
      Callout,
    ],
    content: (props.modelValue as object) ?? '',
    editorProps: {
      attributes: {
        class: 'prose-editor',
        'aria-label': 'Page content editor',
      },
      // Plain-text pastes that look like Markdown are parsed into rich
      // content; rich HTML pastes keep the default behaviour.
      handlePaste(_view, event) {
        if (event.clipboardData?.getData('text/html')) return false
        const text = event.clipboardData?.getData('text/plain')
        if (!text || !looksLikeMarkdown(text)) return false
        event.preventDefault()
        editor.value
          ?.chain()
          .focus()
          .insertContent(markdownToTiptap(text) as object)
          .run()
        return true
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

/* ---------- Link (inline bar — never a native prompt) ---------- */

const linkOpen = ref(false)
const linkUrl = ref('')
const linkError = ref('')
const linkInput = ref<HTMLInputElement | null>(null)

function openLink() {
  linkUrl.value = (editor.value?.getAttributes('link').href as string | undefined) ?? ''
  linkError.value = ''
  linkOpen.value = true
  void nextTick(() => linkInput.value?.focus())
}

function applyLink() {
  let url = linkUrl.value.trim()
  if (!url) {
    linkError.value = 'Enter a URL for the link.'
    return
  }
  // Allow bare domains (example.com) — prepend https:// automatically.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    if (!url.includes('.')) {
      linkError.value = 'Enter a full URL, like https://example.com.'
      return
    }
    url = `https://${url}`
  }
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  linkOpen.value = false
}

function removeLink() {
  editor.value?.chain().focus().unsetLink().run()
  linkOpen.value = false
}

/* ---------- Image upload ---------- */

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

function openImagePicker() {
  fileInput.value?.click()
}

async function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow re-selecting the same file
  if (!file || !editor.value) return

  uploading.value = true
  const { url, error } = await uploadPageImage(auth.userId ?? '', file)
  uploading.value = false

  if (error || !url) {
    toasts.error(error ?? 'Image upload failed.')
    return
  }
  editor.value.chain().focus().setImage({ src: url }).run()
}

/* ---------- Table ---------- */

function insertTable() {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}
</script>

<template>
  <div class="editor">
    <div
      v-if="editor && editable"
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
        @click="openLink"
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
        :class="{ 'tool--active': editor.isActive('callout') }"
        title="Callout"
        aria-label="Callout"
        @click="editor.chain().focus().toggleCallout().run()"
      >
        <Info :size="15" />
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
        title="Insert image"
        aria-label="Insert image"
        :disabled="uploading"
        @click="openImagePicker"
      >
        <ImageIcon :size="15" />
      </button>
      <button
        v-if="!editor.isActive('table')"
        class="tool"
        title="Insert table"
        aria-label="Insert table"
        @click="insertTable"
      >
        <Table :size="15" />
      </button>
      <template v-else>
        <button
          class="tool"
          title="Add row below"
          aria-label="Add row below"
          @click="editor.chain().focus().addRowAfter().run()"
        >
          <Rows3 :size="15" />
        </button>
        <button
          class="tool"
          title="Add column after"
          aria-label="Add column after"
          @click="editor.chain().focus().addColumnAfter().run()"
        >
          <Columns3 :size="15" />
        </button>
        <button
          class="tool"
          title="Delete table"
          aria-label="Delete table"
          @click="editor.chain().focus().deleteTable().run()"
        >
          <Trash2 :size="15" />
        </button>
      </template>

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

    <!-- Inline link editor (replaces the old native prompt) -->
    <div
      v-if="linkOpen"
      class="link-bar"
      role="group"
      aria-label="Edit link"
    >
      <input
        ref="linkInput"
        v-model="linkUrl"
        class="link-bar__input"
        :class="{ 'link-bar__input--error': linkError }"
        type="text"
        placeholder="https://example.com"
        aria-label="Link URL"
        @keyup.enter="applyLink"
        @keyup.escape="linkOpen = false"
      >
      <button
        class="link-bar__btn link-bar__btn--primary"
        @click="applyLink"
      >
        Apply
      </button>
      <button
        v-if="editor && editor.isActive('link')"
        class="link-bar__btn"
        @click="removeLink"
      >
        Remove
      </button>
      <button
        class="link-bar__close"
        aria-label="Close link editor"
        @click="linkOpen = false"
      >
        <X :size="14" />
      </button>
      <p
        v-if="linkError"
        class="link-bar__error"
        role="alert"
      >
        {{ linkError }}
      </p>
    </div>

    <input
      ref="fileInput"
      class="editor__file-input"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      aria-hidden="true"
      tabindex="-1"
      @change="onImageSelected"
    >

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

/* Inline link editor */
.link-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  margin-bottom: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.link-bar__input {
  flex: 1;
  min-width: 160px;
  height: 30px;
  padding: 0 var(--space-2);
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.link-bar__input:focus {
  outline: none;
  border-color: var(--accent);
}

.link-bar__input--error {
  border-color: var(--danger);
}

.link-bar__btn {
  height: 30px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.link-bar__btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.link-bar__btn--primary {
  background: var(--accent);
  color: #202124;
}

.link-bar__btn--primary:hover {
  background: var(--accent-strong);
  color: #202124;
}

.link-bar__close {
  display: flex;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.link-bar__close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.link-bar__error {
  flex-basis: 100%;
  font-size: var(--text-xs);
  color: var(--danger);
}

/* Hidden file picker for image uploads */
.editor__file-input {
  display: none;
}
</style>

import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Callout block (Workflow §11) — a highlighted note container.
 * Stored as <div data-type="callout"> so it round-trips through JSON.
 */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /** Toggle a callout block around the current block. */
      toggleCallout: () => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'inline*',

  // Callouts behave like blockquotes: replacing one with another keeps
  // the cursor sane and prevents nesting surprises.
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'callout', class: 'callout' }),
      0,
    ]
  },

  addCommands() {
    return {
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    }
  },
})

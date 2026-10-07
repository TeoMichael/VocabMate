# Design system

VocabMate uses a soft pink learning interface with white cards, dark plum text, and rose, peach, and lavender accents. The aim is a friendly vocabulary notebook whose controls remain easy to read and use.

The shared tokens and responsive styles live in [frontend/src/index.css](../frontend/src/index.css). React components reuse the same buttons, forms, cards, progress indicators, and status messages. Tailwind's Vite integration is retained; the interface does not add a large component framework or animation library.

## Palette

| Role                           | Shared token                                  | Value                |
| ------------------------------ | --------------------------------------------- | -------------------- |
| Pink page canvas               | `--color-canvas`                              | `#fff8fb`            |
| Soft pink paper                | `--color-paper`                               | `#fff4f9`            |
| White card surface             | `--color-surface`                             | `#ffffff`            |
| Rose background                | `--color-rose`                                | `#ffe6f0`            |
| Rose accent                    | `--color-rose-medium`                         | `#f5a3c4`            |
| Fuchsia/rose primary action    | `--color-primary`                             | `#c52f73`            |
| Primary hover                  | `--color-primary-hover`                       | `#aa245f`            |
| Peach background and accent    | `--color-peach`, `--color-peach-medium`       | `#fff0df`, `#f6c398` |
| Lavender background and accent | `--color-lavender`, `--color-lavender-medium` | `#eee3ff`, `#b5a0df` |
| Lavender foreground            | `--color-purple`                              | `#7153ac`            |
| Main text                      | `--color-text`                                | `#4a2d49`            |
| Secondary text                 | `--color-muted`                               | `#775e75`            |
| Borders                        | `--color-border`                              | `#efd9e5`            |
| Error text/action              | `--color-error`                               | `#a34554`            |

Use the primary color for the main action, selected controls, and focus rings. Soft accent backgrounds distinguish learning cards and summaries. Errors and quiz feedback also include readable text and icons; color alone does not explain a result.

## Typography and components

The font stacks use installed system fonts: Trebuchet MS and Segoe UI for text, with a rounded heading stack. There are no downloaded font dependencies. Headings, short explanations, and clear button labels guide the learner through each page.

- Shared `.button` styles define primary, secondary, and destructive actions.
- `PageHeading`, `SectionHeading`, `Loading`, `EmptyState`, and `ErrorMessage` provide consistent page structure and states.
- Vocabulary uses a table on wider screens and separate word cards on small screens.
- Mastery badges and progress indicators show learning state alongside text labels.
- Quiz cards use one visible prompt, answer controls, feedback, and an explicit next step.
- Lucide SVG icons supply the book, heart, star, and learning symbols. Decorative artwork stays separate from interactive controls.

## Focus and keyboard behavior

A shared `:focus-visible` rule draws a three-pixel primary outline. The layout includes a skip link to the main learning content. Inputs have labels, action icons have accessible names, loading messages use status announcements, and errors use alerts.

The mobile navigation moves focus to its close control, keeps Tab/Shift+Tab within visible menu controls, closes with Escape, and returns focus to the menu button. Background scrolling is paused while it is open. Native modal dialogs have a labelled title and Escape handling.

Typed quiz answers can be submitted with Enter. Answer hints explain normalization and Vietnamese accents. The Next word action clears the previous answer and scrolls to the top of the new prompt, avoiding a mobile session that continues halfway down the previous card.

## Responsive behavior

The layout progressively reduces columns, switches to a mobile menu, and stacks form/actions as width decreases. At widths below 600 pixels, vocabulary becomes word cards with wrapping text and visible edit/delete controls. Narrow quiz options and results wrap within their cards. The authentication page uses dynamic viewport height on mobile.

The interface was exercised at 1280, 820, 390, and 320-pixel browser widths. The body follows the client width, including a scrollbar gutter, instead of imposing a minimum width that causes overflow. Reduced-motion preferences shorten decorative animation and transitions. Keep future changes in the shared tokens/components, and check long Vietnamese meanings, keyboard focus, and narrow widths when adding a new page.

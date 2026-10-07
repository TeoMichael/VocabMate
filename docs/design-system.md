# Design system

VocabMate uses a vibrant pink learning interface with dark plum text, tinted cards, and lavender, yellow, coral, and peach accents. The existing page layout stays familiar; stronger color makes practice, progress, and small achievements easier to notice.

The shared tokens and responsive styles live in [frontend/src/index.css](../frontend/src/index.css). React components reuse the same buttons, forms, cards, progress indicators, and status messages. Tailwind's Vite integration is retained; the interface does not add a large component framework or animation library.

## Palette

| Role                           | Shared token                                  | Value                |
| ------------------------------ | --------------------------------------------- | -------------------- |
| Pink page canvas               | `--color-canvas`                              | `#fff0f7`            |
| Blush paper                    | `--color-paper`                               | `#ffe6f1`            |
| Light pink card surface        | `--color-surface`                             | `#fffafd`            |
| Rose background                | `--color-rose`                                | `#ffd2e5`            |
| Rose accent                    | `--color-rose-medium`                         | `#f678b0`            |
| Hot pink primary action        | `--color-primary`                             | `#d01878`            |
| Primary hover                  | `--color-primary-hover`                       | `#ad105f`            |
| Peach background and accent    | `--color-peach`, `--color-peach-medium`       | `#ffe4cb`, `#ffb279` |
| Lavender background and accent | `--color-lavender`, `--color-lavender-medium` | `#e6d7ff`, `#aa78ee` |
| Purple foreground              | `--color-purple`                              | `#7235ac`            |
| Learning background and text   | `--color-yellow`, `--color-warm`              | `#fff0b5`, `#80500f` |
| Coral background and accent    | `--color-coral`, `--color-coral-strong`       | `#ffe0dc`, `#b63353` |
| Main text                      | `--color-text`                                | `#44213d`            |
| Secondary text                 | `--color-muted`                               | `#75536e`            |
| Borders                        | `--color-border`                              | `#efbfd5`            |
| Correct/success text and fill  | `--color-success`, `--color-success-soft`     | `#176b44`, `#d6f8e5` |
| Incorrect/error text and fill  | `--color-error`, `--color-error-soft`         | `#ad244b`, `#ffe0e8` |

Use pink/fuchsia for primary actions and selected controls, purple for secondary highlights, and yellow/peach for learning encouragement. Reserve green for correctness and successful actions. Missed answers and destructive actions use rose-red. Feedback includes text and icons, so color alone never explains an answer.

The primary button gradient runs from `#d01878` to `#b51d94`. Progress bars use pink-to-purple, and the daily goal ring uses an SVG gradient with a unique ID per component. Keep text on light tinted surfaces or deliberately dark backgrounds. Targeted contrast checks are recorded in [verification](verification.md).

## Typography and components

The font stacks use installed system fonts: Trebuchet MS and Segoe UI for text, with a rounded heading stack. There are no downloaded font dependencies. Headings, short explanations, and clear button labels guide the learner through each page.

- Shared `.button` styles define primary, secondary, and destructive actions.
- `PageHeading`, `SectionHeading`, `Loading`, `EmptyState`, and `ErrorMessage` provide consistent page structure and states.
- Vocabulary uses a table on wider screens and separate word cards on small screens.
- Mastery badges and progress indicators show learning state alongside text labels.
- Quiz cards use one visible prompt, answer controls, feedback, and an explicit next step.
- Lucide SVG icons supply the book, heart, star, and learning symbols. Decorative artwork stays separate from interactive controls.

## Page treatments

- Dashboard: a saturated magenta practice hero, cream CTA, subtle circles/sparkles, and a yellow goal card. Four stat cards use pink, purple, yellow, and coral surfaces with matching icon chips.
- Sidebar: a blush/lavender panel, strong pink selected item, tinted icon chips, encouragement card, and a clearly grouped profile area.
- Vocabulary: a rose table header, alternating tinted rows, small colored edge accents, lavender topic pills, and distinct mastery pills. New is coral, Learning is yellow, Familiar is lavender, and Mastered is purple. Mobile cards retain the same labels and actions.
- Practice: pink/purple progress, a tinted question card, four color-accented modes, green correct feedback, and supportive rose missed-answer feedback. Revealing a flashcard highlights its meaning on yellow.
- Weekly review: pink/lavender summary, a cream calendar motif, and three tinted selection steps. Completed weekly reviews add a trophy, an achievement label, and a few static confetti dots above the score and mistake review.
- Authentication: a richer rose/lavender story panel, a cream word-card illustration, and a rounded form card on a tinted background. The mobile form keeps comfortable input widths.
- Empty states: a small book-heart illustration with a sparkle, brief encouragement, and a visible next action.

Buttons lift slightly on hover and depress on click. Flashcard reveals and answer feedback use a 220ms fade/move transition; there is no animation dependency or continuous celebration. Reduced-motion preferences shorten these effects.

## Focus and keyboard behavior

A shared `:focus-visible` rule draws a three-pixel primary outline; the saturated dashboard hero uses yellow for a visible focus outline. The layout includes a skip link to the main learning content. Inputs have labels, action icons have accessible names, loading messages use status announcements, and errors use alerts.

The mobile navigation moves focus to its close control, keeps Tab/Shift+Tab within visible menu controls, closes with Escape, and returns focus to the menu button. Background scrolling is paused while it is open. Native modal dialogs have a labelled title and Escape handling.

Typed quiz answers can be submitted with Enter. Answer hints explain normalization and Vietnamese accents. The Next word action clears the previous answer and scrolls to the top of the new prompt, avoiding a mobile session that continues halfway down the previous card.

## Responsive behavior

The layout progressively reduces columns, switches to a mobile menu, and stacks form/actions as width decreases. At widths below 600 pixels, vocabulary becomes word cards with wrapping text and visible edit/delete controls. Narrow quiz options and results wrap within their cards. The authentication page uses dynamic viewport height on mobile.

The interface was exercised at 1280, 820, 390, and 320-pixel browser widths. The body follows the client width, including a scrollbar gutter, instead of imposing a minimum width that causes overflow. Reduced-motion preferences shorten decorative animation and transitions. Keep future changes in the shared tokens/components, and check long Vietnamese meanings, keyboard focus, and narrow widths when adding a new page.

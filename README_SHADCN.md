# shadcn/ui Setup

This project uses **shadcn/ui** components, which are built on top of **Radix UI** primitives with Tailwind CSS styling.

## What is shadcn/ui?

shadcn/ui is **not a component library** - it's a collection of reusable components built with Radix UI and Tailwind CSS. The components are:
- **Copied into your project** (not installed as dependencies)
- Built on **Radix UI** primitives for accessibility
- Styled with **Tailwind CSS**
- Fully customizable and editable

## Current Setup

✅ **Components.json** - Configured for Tailwind v4
✅ **All shadcn components** - Already created in `components/ui/`
✅ **Utility functions** - `lib/utils.ts` with `cn()` helper
✅ **CSS Variables** - Properly configured in `app/globals.css`

## Adding More Components

To add more shadcn/ui components, use:

```bash
npm run ui:add
```

Or directly:
```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add sheet
```

## Components Already Included

- ✅ Button
- ✅ Card
- ✅ Badge
- ✅ Avatar
- ✅ Dropdown Menu
- ✅ Tabs
- ✅ Table
- ✅ Input
- ✅ Separator
- ✅ Progress

## Important Notes

1. **Radix UI is required** - shadcn/ui components use Radix UI primitives, so `@radix-ui/*` packages are dependencies
2. **Tailwind v4** - This project uses Tailwind CSS v4 with CSS-first configuration
3. **Components are yours** - All components in `components/ui/` are copied into your project and can be modified

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)

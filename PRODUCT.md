# Product

## Register

brand

## Users

Two audiences. Primary: the Nautique Central dealership principals this demo site is pitched to — they judge it against Nautique global, Malibu and premium auto-brand sites. Secondary: affluent Australian wake/surf/ski boat buyers ($150k–$400k+ purchases) browsing on desktop at home and phone at the ramp; the job is "shortlist a boat, book an on-water demo".

## Product Purpose

A live demo/pitch website for Nautique Central (authorised AU dealer: Nautique, Supreme, Matrix; showrooms in Penrith NSW, Yatala QLD, Braeside VIC). Success = the dealership signs off and buyers convert to demo bookings. Static HTML/CSS/JS, GSAP + Lenis, Storyblok as data source, deployed to GitHub Pages.

## Brand Personality

Cinematic, precise, confident. Dark charcoal + white + a single Nautique red (#ED1C24). Condensed uppercase display type (Clash Display) over full-bleed on-water photography. The motion language is "heavy water": inertial, expo-out settles, unveils rather than fades.

## Anti-references

- Generic boat-dealer template sites (white background, blue buttons, spec dumps).
- Novelty motion: Roy rejected the custom cursor; a prior luxury audit flagged the bobbing configurator boat and bottom-cruising boat as novelty. New motion must read as restraint and craft, not gimmick.
- AI-slop landing grammar: uniform fade-up on every section, bounce easings, glassmorphism-by-default.

## Design Principles

1. Photography is the design; chrome stays barely-there.
2. One choreographed moment per view beats scattered effects.
3. Unveil, don't fade: masks, clips and parallax over opacity-only.
4. Robust by default: mobile stays static, reduced-motion collapses cleanly, content never depends on a trigger firing.
5. Every number is real (specs, stats); motion may dramatise data but never invent it.

## Accessibility & Inclusion

WCAG AA contrast on dark (muted greys lifted already). `prefers-reduced-motion` fully collapses motion. Keyboard: skip link, focus-visible outlines, esc-closes mobile nav. Scroll-reveal gated to desktop so iOS viewport quirks can't hide content.

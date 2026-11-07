# Design brief

Written 2026-11-07 from the project owner's description. Items under **Assumptions** were
not stated and should be confirmed or corrected; everything else is from the brief.

## Goal

A tool that takes satellite SAR (synthetic aperture radar) data for an area and two dates,
renders images of what changed with Python/matplotlib, and explains the change in language a
non-technical person can understand.

## Audience

- Primary: people with no remote-sensing or programming background who need to know "did
  this place change, and roughly how?" (disaster response, local officials, journalists,
  students).
- Secondary: the team itself, who need to plug in their own pipeline stages without stepping
  on each other.

## Success looks like

1. A visitor can pick an area and two dates and, within the page, see before/after/change
   images and a short plain-English explanation.
2. Each teammate can push their stage (fetch, process, visualize, analyze, or UI) to GitHub on
   their own branch and have it integrate without manual stitching.
3. Every version of the project is navigable through git tags and the changelog.

## Constraints from the brief

- Python with matplotlib for image generation.
- GitHub with version control; teammates push their own code.
- Start with the frontend (UI/UX) first.
- NISAR (NASA-ISRO SAR) is the intended source but its coverage is inconsistent, so the
  tool only lists places with verified usable scenes. Sentinel-1 is the fallback.
- Entry screen is a game-like world map: hover highlights a continent, click opens a
  translucent panel of verified countries, pick one to zoom in, then pick a state.
  Visual style: techy and edgy. More sections (landing, info) come later.

## Assumptions (please confirm)

| # | Assumption | If wrong |
|---|-----------|----------|
| 1 | Web app, not desktop or notebook. | Swap `frontend/` for a Streamlit app; the backend stages stay. |
| 2 | React + TypeScript for the UI. | Any framework works against the same contract. |
| 3 | Sentinel-1 GRD, VV polarisation, as the fallback source until NISAR scenes are verified. | Add `nisar` to the `source` enum in the contract. |
| 4 | Change detection by log-ratio with speckle filtering is an acceptable first method. | Replace `process.compute_change()`; signature unchanged. |
| 5 | Plain-language text is rule-based for now; an LLM can be added inside `analyze.py` later. | Same signature, different implementation. |
| 6 | Synchronous requests are fine while data is synthetic. | Job queue sketched in ARCHITECTURE "Known limits". |
| 7 | Dark "mission control" visual style with teal/orange/blue change colours. | Edit `@theme` tokens in `frontend/src/index.css`. |
| 8 | Private GitHub repository to start. | `scripts/publish_to_github.sh <name> public`. |

## Out of scope for v0.1

Authentication, saving results, multi-user history, maps with drawing tools, deployment.

## Open questions

- Which area and event will the first real demo use? (Pick a flat, flood-prone region with
  known dates; it makes the log-ratio method look its best.)
- Who owns which stage? Fill in the owner lines in `backend/app/sar/*.py` docstrings.
- Is there a deadline or submission format (e.g. a hackathon)? It affects whether the job
  queue is needed before the map picker.

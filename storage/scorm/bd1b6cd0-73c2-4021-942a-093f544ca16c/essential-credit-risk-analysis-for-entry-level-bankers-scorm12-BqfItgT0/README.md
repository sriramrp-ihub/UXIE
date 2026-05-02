# Essential Credit Risk Analysis for Entry-Level Bankers

> **SCORM 1.2 e-Learning Package** | Built with Articulate Rise | Version 1

This package is a self-contained SCORM 1.2 compliant e-learning course designed for entry-level banking professionals. It covers the fundamentals of credit risk analysis and is ready to be uploaded to any SCORM 1.2-compatible Learning Management System (LMS).

---

## Table of Contents

- [Overview](#overview)
- [SCORM Standard](#scorm-standard)
- [Getting Started](#getting-started)
- [File Structure](#file-structure)
- [Component Descriptions](#component-descriptions)
  - [Root-Level Files](#root-level-files)
  - [scormdriver/](#scormdriver)
  - [scormcontent/](#scormcontent)
- [Configuration](#configuration)
- [Auto-Scripts](#auto-scripts)
- [Assets](#assets)
- [Fonts](#fonts)
- [Deployment](#deployment)
- [Technical Specifications](#technical-specifications)

---

## Overview

| Property         | Value                                                        |
|------------------|--------------------------------------------------------------|
| **Course Title** | Essential Credit Risk Analysis for Entry-Level Bankers       |
| **SCORM Version**| SCORM 1.2                                                    |
| **Authoring Tool**| Articulate Rise                                             |
| **Language**     | English (`en`)                                               |
| **Status**       | Final                                                        |
| **Entry Point**  | `scormdriver/indexAPI.html`                                  |
| **Manifest ID**  | `Aq1LsFc3pZ-uMfXmh6Wyr281YDj0IqqoBqfItgT0`                  |
| **App ID**       | `WQBM2ARBZR`                                                 |
| **Driver Version**| 7.12.0.a.1.4.1                                             |
| **Commit Interval**| Every 20 seconds (`FORCED_COMMIT_TIME: 20000`)            |

---

## SCORM Standard

This package conforms to **ADL SCORM 1.2**, using the following XML schemas:

| Schema | File |
|--------|------|
| IMS Content Packaging v1.1.2 | `imscp_rootv1p1p2.xsd` |
| ADL SCORM 1.2 | `adlcp_rootv1p2.xsd` |
| IMS XML base | `ims_xml.xsd` |
| SCORM Engine Package Properties | `ScormEnginePackageProperties.xsd` |

---

## Getting Started

### Upload to LMS

1. Compress the entire folder into a `.zip` file.
2. Upload the `.zip` to your SCORM 1.2-compatible LMS (e.g., Moodle, TalentLMS, Cornerstone, SCORM Cloud).
3. The LMS will parse `imsmanifest.xml` and launch the course from `scormdriver/indexAPI.html`.

### Local Preview (without LMS)

> ⚠️ SCORM tracking requires a live LMS. Local preview will not save progress.

Serve the directory with any local HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (npx)
npx serve .
```

Then open: `http://localhost:8080/scormdriver/indexAPI.html`

---

## File Structure

```
essential-credit-risk-analysis-for-entry-level-bankers-scorm12-BqfItgT0/
│
├── README.md                              ← This file
├── imsmanifest.xml                        ← SCORM package manifest (entry point for LMS)
├── metadata.xml                           ← LOM metadata describing the course
│
├── [XML Schema Definitions]
│   ├── imscp_rootv1p1p2.xsd              ← IMS Content Package schema
│   ├── adlcp_rootv1p2.xsd               ← ADL SCORM 1.2 extension schema
│   ├── ims_xml.xsd                       ← IMS XML base schema
│   └── ScormEnginePackageProperties.xsd  ← SCORM Engine proprietary properties schema
│
├── scormdriver/                           ← SCORM communication layer (LMS bridge)
│   ├── indexAPI.html                      ← Course launch page (LMS entry point)
│   ├── scormdriver.js                     ← Core SCORM API driver (~450 KB)
│   ├── driverOptions.js                   ← Runtime configuration options
│   ├── browsersniff.js                    ← Browser compatibility detection
│   ├── preloadIntegrity.js               ← Asset preload/integrity checking
│   ├── AICCComm.html                      ← AICC communication bridge
│   ├── blank.html                         ← Blank utility page
│   ├── goodbye.html                       ← Session termination page
│   └── auto-scripts/                      ← Automation utility scripts
│       ├── AutoBookmark.js               ← Auto-saves learner's last location
│       ├── AutoCompleteSCO.js            ← Auto-marks SCO as complete on reach
│       └── CourseExit.js                 ← Handles confirmed course exit
│
└── scormcontent/                          ← Course content (Articulate Rise output)
    ├── index.html                         ← Main Rise course entry HTML (~170 KB)
    │
    ├── assets/                            ← Course media assets (images)
    │   ├── small.png                      ← Utility/thumbnail image
    │   ├── vEMkj-NSW8foDCPQ.jpg           ← Course banner/hero image
    │   ├── ai-generated-image.jpg         ← Root AI-generated illustration
    │   ├── 16-LKw/
    │   │   └── ai-generated-image.jpg    ← Section-specific illustration
    │   ├── WRqvd0/
    │   │   └── ai-generated-image.jpg    ← Section-specific illustration
    │   ├── aSwiC2/
    │   │   └── ai-generated-image.jpg    ← Section-specific illustration
    │   ├── Z7vkL7/
    │   │   └── ai-generated-image.jpg    ← Section-specific illustration
    │   ├── x37d1v/
    │   │   └── ai-generated-image.jpg    ← Section-specific illustration
    │   ├── _Y7LQ2/
    │   │   └── ai-generated-image.jpg    ← Section-specific illustration
    │   ├── xt_3g6/
    │   │   └── ai-generated-image.jpg    ← Section-specific illustration
    │   └── lIPtEL/
    │       └── ai-generated-image.jpg    ← Section-specific illustration
    │
    └── lib/                               ← Runtime JavaScript and CSS libraries
        ├── lzwcompress.js                 ← LZW data compression utility (suspend data)
        │
        ├── fonts/                         ← Embedded web fonts (WOFF format)
        │   ├── Lato2-Regular.woff
        │   ├── Lato2-Light.woff
        │   ├── Lato2-Italic.woff
        │   ├── Lato2-Bold.woff
        │   ├── Lato2-Black.woff
        │   ├── Merriweather-Regular.woff
        │   ├── Merriweather-Light.woff
        │   ├── Merriweather-Italic.woff
        │   ├── Merriweather-Bold.woff
        │   └── Merriweather-Black.woff
        │
        ├── rise/                          ← Articulate Rise core framework bundles
        │   ├── *.js                       ← Chunked JavaScript bundles (lazy-loaded)
        │   ├── *.css                      ← Chunked CSS stylesheets
        │   └── *.ttf / *.woff            ← Icon/symbol fonts
        │
        ├── learn_dist/                    ← Rise "Learn" player runtime
        │   ├── entry.js                   ← Player initialization entry point
        │   ├── 9b1f8619.js               ← Player logic chunk
        │   ├── f41eaafd.js               ← Player logic chunk
        │   └── fd678823.css              ← Player styles
        │
        ├── mondrian/                      ← Rise layout/rendering engine
        │   ├── entry.js                   ← Mondrian engine entry point
        │   ├── 651f6318.js
        │   ├── afbb5ca8.js
        │   ├── 5e5f4cf5.js
        │   ├── 09e37aee.js
        │   └── 196251cf.js
        │
        └── sandbox/                       ← Isolated sandbox iframe environment
            ├── sandbox.html              ← Sandbox host page
            ├── c77685df.js              ← Sandbox logic
            └── 4adfab46.css             ← Sandbox styles
```

---

## Component Descriptions

### Root-Level Files

| File | Purpose |
|------|---------|
| `imsmanifest.xml` | The SCORM package manifest. The LMS reads this file first to discover course structure, organizations, and all resource file references. Contains the course title, SCO identifier, and launch URL. |
| `metadata.xml` | IEEE LOM (Learning Object Metadata) descriptor. Provides language, version, status, copyright, and classification information for the course object. |
| `imscp_rootv1p1p2.xsd` | XML Schema for IMS Content Packaging — validates the manifest structure. |
| `adlcp_rootv1p2.xsd` | XML Schema for ADL SCORM 1.2 extensions — validates SCORM-specific manifest attributes like `adlcp:scormtype`. |
| `ims_xml.xsd` | Base XML namespace schema used by IMS specifications. |
| `ScormEnginePackageProperties.xsd` | Proprietary schema for SCORM Engine (Rustici Software) display and behavior settings embedded in `metadata.xml`. |

---

### `scormdriver/`

The communication layer between the course content and the LMS. Built on the **Articulate SCORM Driver v7.12.0**.

| File | Purpose |
|------|---------|
| `indexAPI.html` | The LMS launch page. The LMS navigates to this URL. It initializes the SCORM API, sets up the driver, then loads the course content in an iframe or redirect. |
| `scormdriver.js` | The heart of the package (~450 KB). Implements the full SCORM 1.2 JavaScript API (`API` object), manages LMS communication (`LMSInitialize`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`, `LMSFinish`), tracks completion, score, time, and suspend data. |
| `driverOptions.js` | Runtime configuration file. Contains key/value settings loaded at driver startup (see [Configuration](#configuration)). |
| `browsersniff.js` | Detects browser type and version. Used by the driver to apply compatibility workarounds for older browsers. |
| `preloadIntegrity.js` | Verifies that all required assets are preloaded and uncorrupted before the course begins. Helps diagnose broken package deployments. |
| `AICCComm.html` | AICC communication page. Provides a cross-domain communication bridge for AICC-compatible LMSes (secondary protocol). |
| `blank.html` | A minimal blank page used as a placeholder or intermediate redirect target within the driver flow. |
| `goodbye.html` | Displayed when the learner exits or the SCORM session finalizes. Shows a session-end message. |

---

### `scormcontent/`

The actual course content exported from **Articulate Rise**.

| File/Dir | Purpose |
|----------|---------|
| `index.html` | The Rise player shell (~170 KB). Contains all course data (lessons, blocks, quiz content) embedded as compressed JSON, plus the bootstrapping logic that initializes the Rise player. |
| `assets/` | All media referenced by course blocks. Images are stored at the root and in per-block subdirectories (hashed folder names correspond to specific Rise content blocks). |
| `lib/` | All JavaScript, CSS, and font runtime dependencies needed to run the Rise player. |

---

## Configuration

Edit **`scormdriver/driverOptions.js`** to adjust runtime behavior:

```js
function loadDriverOptions(scope) {
  scope.APPID = "WQBM2ARBZR";           // Articulate App ID — do not change
  scope.CLOUDURL = null;                 // Set to Articulate Cloud URL if using hosted mode
  scope.USE_STRICT_SUSPEND_DATA_LIMITS = false; // Enforce 4096-char SCORM 1.2 suspend data limit
  scope.SHOW_DEBUG_ON_LAUNCH = false;    // Set true to open debug console on launch
  scope.FORCED_COMMIT_TIME = 20000;      // Auto-commit interval in ms (default: every 20 seconds)
  scope.strLMSStandard = "SCORM";        // LMS protocol: "SCORM" or "AICC"
  scope.REVIEW_MODE_IS_READ_ONLY = false;// If true, Review Mode prevents data writes to LMS
}
```

> ⚠️ Do **not** change `APPID` — it is tied to the Articulate license for this content.

---

## Auto-Scripts

Three lightweight automation scripts run at specific lifecycle events:

| Script | Trigger | Behavior |
|--------|---------|----------|
| `AutoBookmark.js` | On page load within each SCO | Automatically calls `SetBookmark()` to save the learner's current URL position and commits the data to the LMS. |
| `AutoCompleteSCO.js` | When the learner reaches the end | Calls `SetReachedEnd()` and `CommitData()` to mark the SCO as complete automatically without requiring manual LMS calls. |
| `CourseExit.js` | On explicit exit action | Prompts *"Are You Sure You Wish To Exit This Course?"* and calls `ConcedeControl()` to end the SCORM session cleanly. |

---

## Assets

Media files are stored in `scormcontent/assets/`. Subdirectory names are hashed identifiers auto-generated by Articulate Rise — each corresponds to a specific content block in the course.

| Asset | Description |
|-------|------------|
| `small.png` | Thumbnail / utility image used by the Rise player UI |
| `vEMkj-NSW8foDCPQ.jpg` | Course hero/banner image |
| `ai-generated-image.jpg` (root) | Default AI-generated course illustration |
| `16-LKw/ai-generated-image.jpg` | Block-specific AI illustration |
| `WRqvd0/ai-generated-image.jpg` | Block-specific AI illustration |
| `aSwiC2/ai-generated-image.jpg` | Block-specific AI illustration |
| `Z7vkL7/ai-generated-image.jpg` | Block-specific AI illustration |
| `x37d1v/ai-generated-image.jpg` | Block-specific AI illustration |
| `_Y7LQ2/ai-generated-image.jpg` | Block-specific AI illustration |
| `xt_3g6/ai-generated-image.jpg` | Block-specific AI illustration |
| `lIPtEL/ai-generated-image.jpg` | Block-specific AI illustration |

---

## Fonts

The course ships with self-hosted WOFF fonts to ensure consistent rendering on all LMSes (no Google Fonts CDN dependency):

| Font Family | Weights Included |
|-------------|-----------------|
| **Lato2** | Regular, Light, Italic, Bold, Black |
| **Merriweather** | Regular, Light, Italic, Bold, Black |

All fonts are located in `scormcontent/lib/fonts/`.

---

## Deployment

### Compatibility

| Feature | Detail |
|---------|--------|
| SCORM Version | **SCORM 1.2** (not SCORM 2004) |
| AICC Support | Yes (via `AICCComm.html`) |
| Compatible LMSes | Moodle, TalentLMS, Cornerstone, SAP SuccessFactors, Docebo, SCORM Cloud, etc. |
| Browser Support | All modern browsers (Chrome, Edge, Firefox, Safari) |
| Mobile | Responsive (Rise is mobile-friendly) |
| Desired Resolution | 750 × 550 px (scales to full screen) |

### Upload Checklist

- [ ] The root folder is zipped (e.g., `essential-credit-risk-...scorm12.zip`)
- [ ] `imsmanifest.xml` is at the **root** of the zip (not inside a subfolder)
- [ ] No `.DS_Store` files cause issues (macOS artifact — safe to delete before zipping)
- [ ] LMS is configured for **SCORM 1.2**
- [ ] Completion criterion set on the LMS matches course logic (completion on reach-end)

### Removing macOS Artifacts Before Zipping

```bash
# Run from the package root before creating the zip
find . -name ".DS_Store" -delete
```

---

## Technical Specifications

| Property | Value |
|----------|-------|
| SCORM Standard | ADL SCORM 1.2 |
| Manifest Identifier | `Aq1LsFc3pZ-uMfXmh6Wyr281YDj0IqqoBqfItgT0` |
| Organization Identifier | `articulate_rise` |
| SCO Identifier | `r1` |
| Launch File | `scormdriver/indexAPI.html` |
| Suspend Data Compression | LZW (via `lzwcompress.js`) |
| Auto-Commit Interval | 20,000 ms (20 seconds) |
| Score Overrides Status | No |
| Interaction Validation | Yes |
| Always Flow to First SCO | Yes |
| Review Mode | Read-Write (configurable) |
| Driver Version | 7.12.0.a.1.4.1 |
| Driver SHA | `5d8e9020de613ed90881a5eb55369c6badd45130` |

---

*Generated for the UXIE project. Course built with Articulate Rise and packaged to SCORM 1.2 specification.*

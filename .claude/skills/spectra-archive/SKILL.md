---
name: spectra-archive
description: "Archive a completed change"
license: MIT
compatibility: Requires spectra CLI.
metadata:
  author: spectra
  version: "1.0"
  generatedBy: "Spectra"
---

Archive a completed change.

**Input**: Optionally specify a change name after `/spectra-archive` (e.g., `/spectra-archive add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Prerequisites**: This skill requires the `spectra` CLI. If any `spectra` command fails with "command not found" or similar, report the error and STOP.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `spectra list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `spectra status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Prompt user for confirmation to continue
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Prompt user for confirmation to continue
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess what the archive will apply to the main specs**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, skip this step.

   **There is no separate sync action, and no sync skill to call.** `spectra archive` applies the
   deltas itself (see step 6). This step exists so the user sees what is about to change, not to
   change it.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what the archive will apply (adds, modifications, removals, renames)
   - For every `## MODIFIED` / `## REMOVED` / `## RENAMED` block, verify the requirement name
     matches an existing heading in the main spec **exactly**. A name that does not match is the
     failure worth catching here: the delta lands as a second requirement rather than replacing the
     first, and nothing reports it.
   - Show a combined summary

   **Prompt options:**
   - If the delta names all resolve: "Archive (applies the deltas)", "Archive without applying (`--skip-specs`)", "Cancel"
   - If any name does not resolve: say which, and offer "Fix the delta first" alongside the above.
     Do not archive a mismatched name without the user choosing to.

5. **Clean up tracking file**

   Delete `.spectra/touched/<change-name>.json` if it exists. This file contains implementation tracking data that is not needed after archiving.

   ```bash
   rm -f .spectra/touched/<change-name>.json
   ```

   If the file does not exist, silently continue.

6. **Perform the archive**

   Use the `spectra archive` CLI command which handles the full archive workflow
   (spec snapshot, delta application, @trace injection, identity recording, vector indexing):

   ```bash
   spectra archive <name>
   ```

   **Optional flags:**
   - `--skip-specs` — skip delta spec application (for tooling/doc-only changes)
   - `--mark-tasks-complete` — mark all incomplete tasks as complete before archiving
   - `--no-validate` — skip delta spec validation

   **If archive fails** with "already exists" error, suggest renaming existing archive.

   Read the reported counts (`added: N, modified: N, removed: N, renamed: N`) — step 7 needs to
   know which capabilities were newly created.

7. **Write the Purpose for specs the archive created or changed**

   Delta specs carry requirements only, never `## Purpose` text, so the CLI cannot write one.

   **For every capability the archive reports under `added`:** the generated spec's Purpose is the
   placeholder `TBD - created by archiving change '<name>'. Update Purpose after archive.` Replace
   it with a written summary of what the capability covers. Leaving it turns the placeholder into
   permanent documentation debt that no check reports — grep `openspec/specs/` for `TBD` to see
   whether an earlier archive already left one.

   **For every capability under `modified`:** read its Purpose against the requirements as they now
   stand. A modified requirement often adds behaviour the Purpose paragraph does not mention, and a
   Purpose that under-describes its own spec is how a later reader concludes a capability does less
   than it does. Update the sentence when it no longer covers the requirements; leave it when it
   already does.

   Do not invent scope here. The Purpose summarises requirements that exist — if writing it
   surfaces a behaviour no requirement states, that is a gap in the spec, not something to paper
   over in the summary.

8. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - What the archive applied to the main specs (the reported counts, or "no delta specs")
   - Which Purposes were written or refreshed in step 7
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** applied — added: 1, modified: 4, removed: 0, renamed: 0
**Purpose:** written for `<new-capability>`; `<modified-capability>` refreshed

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** No delta specs

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** not applied (archived with `--skip-specs`)

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta specs were not applied (archived with `--skip-specs`)

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```
## Archive Failed

**Change:** <change-name>
**Target:** openspec/changes/archive/YYYY-MM-DD-<name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**Guardrails**

- Always prompt for change selection if not provided
- Use artifact graph (spectra status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- Never call a `spectra-sync-specs` skill — it does not exist, and `spectra archive` applies the
  deltas itself. Earlier revisions of this skill dispatched to it and the archive stalled there.
- If delta specs exist, always run the step 4 assessment and show the combined summary before
  prompting, including whether every MODIFIED/REMOVED/RENAMED name resolves to an existing heading
- Never leave a newly created spec carrying the CLI's `TBD` Purpose placeholder (step 7)
- If **AskUserQuestion tool** is not available, ask the same questions as plain text and wait for the user's response

# Trajectory viewer

Explore model runs as readable timelines of messages, tool calls, and results. Compare attempts across models and follow each trajectory step by step.

## Get started

1. Open the viewer in your browser.
2. Click **Choose runs folder** and select your local `runs/` folder.
3. Expand an attempt to read its trajectory.

The folder immediately inside `runs/` can have any name. You can also select that dataset folder directly. To switch datasets, click **Choose another folder**.

Your files stay on your device. The viewer reads them locally without uploading them to a server. Refreshing the page clears your selection. Sharing the viewer’s link does not share your files; each person selects their own folder.

## Organize your files

The viewer expects this folder structure:

```text
runs/
└── <dataset-folder>/
    └── <model>/
        └── prior/
            ├── attempt-01-trajectory.json
            ├── attempt-01-artifacts/
            │   └── logs/artifacts/summary.md
            ├── attempt-02-trajectory.json
            ├── attempt-02-artifacts/
            │   └── logs/artifacts/summary.md
            └── ...
```

Each model can have any number of attempts. Attempts appear in numeric order.
Optional summaries are matched to trajectories in the same dataset and model by attempt number. The `attempt-NN-artifacts` folder increments with each attempt. Missing summaries do not prevent trajectories from loading.

When the four model folders are present, the viewer shows them in this order:

Otherwise, it shows the first four folders alphabetically. Completely empty folders are not detected.

## Explore a trajectory

- **Navigate models and attempts** in the sidebar. Select an attempt to open it and jump to its timeline, select **All attempts** under a model to browse that model, or select **All models** to see everything. Model groups in the sidebar can be expanded or collapsed.
- **Expand or collapse attempts** by clicking their headings.
- **Review session details** at the top of an expanded attempt, including the model, agent, and step counts. Included steps are those present in the file; reported steps are the total recorded by the run.
- **Read messages** in their original step order. Expand reasoning, tool arguments, and results as needed.
- **Search an attempt** across its messages, tools, and other fields, or filter steps by source. Search includes collapsed steps.
- **Browse all steps** immediately when an attempt opens. Steps start collapsed; click a step to read it, or use **Expand steps** and **Collapse steps** for the current filtered list. Use **Show full content** to remove the height limit on long messages.
- **Inspect additional fields** through the step and session details, or use **Download JSON** to save the original file.
- **Read attempt summaries** in the separate expandable **Attempt NN · Summary** panel immediately after each trajectory. Summaries load when expanded, independently of the trajectory. **Markdown formatting** starts on; turn it off to view the exact source text. Headings, lists, tables, links, and code blocks are supported. Embedded active content and images are excluded; external links open only when clicked.

Messages preserve line breaks, indentation, and Markdown text as written.
Summary formatting uses locally bundled Marked and DOMPurify libraries; no CDN connection is needed when viewing files.

## Metadata viewer

Open the **Metadata** tab, then **Choose metadata JSON** to select a single file, or paste JSON and click **View metadata**. This input is separate from the runs folder and stays on your device.

The viewer reads `metadata.validationOutputs.chains[0].validations[0].outputs.feedbacks[0]` and `feedbacks[1]`. Each entry's `taxonomy` supplies the check name and its `reasoning` supplies the content, with a **Markdown formatting** toggle. String entries and objects with `content`, `text`, or `markdown` text are also supported. Objects retain their complete original data under **All feedback fields**; unfamiliar object formats display as JSON. Missing entries and invalid JSON show a clear message. Switching tabs preserves your loaded content.

## Troubleshooting

**No attempts found:** Check that you selected `runs/` or the dataset folder inside it, and that files are inside each model’s `prior/` folder with names such as `attempt-01-trajectory.json`.

**An attempt cannot be opened:** The file must contain valid trajectory JSON with a `steps` array of step objects. Other attempts can still be viewed.

**Files changed on disk:** Select the folder again to load the updated files.

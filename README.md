# Trajectory viewer

Explore model runs as readable timelines of messages, tool calls, and results. Compare attempts across models and follow each trajectory step by step.

## Get started

1. Open the viewer in your browser.
2. Click **Choose runs folder** and select your local `runs/` folder.
3. Expand an attempt to read its trajectory.

You can also select the `adaptive-predicate-ordering/` folder directly. To switch datasets, click **Choose another folder**.

Your files stay on your device. The viewer reads them locally without uploading them to a server. Refreshing the page clears your selection. Sharing the viewer’s link does not share your files; each person selects their own folder.

## Organize your files

The viewer expects this folder structure:

```text
runs/
└── adaptive-predicate-ordering/
    └── <model>/
        └── prior/
            ├── attempt-01-trajectory.json
            ├── attempt-02-trajectory.json
            └── ...
```

Each model can have any number of attempts. Attempts appear in numeric order.

When the four model folders are present, the viewer shows them in this order:

Otherwise, it shows the first four folders alphabetically. Completely empty folders are not detected.

## Explore a trajectory

- **Navigate models and attempts** in the sidebar. Select an attempt to open it and jump to its timeline, select **All attempts** under a model to browse that model, or select **All models** to see everything. Model groups in the sidebar can be expanded or collapsed.
- **Expand or collapse attempts** by clicking their headings.
- **Review session details** at the top of an expanded attempt, including the model, agent, and step counts. Included steps are those present in the file; reported steps are the total recorded by the run.
- **Read messages** in their original step order. Expand reasoning, tool arguments, and results as needed.
- **Search an attempt** across its messages, tools, and other fields, or filter steps by source. Search includes steps that have not yet been displayed.
- **Load more steps** to continue beyond the first 50. Use **Show full content** to remove the height limit on long messages.
- **Inspect additional fields** through the step and session details, or use **Download JSON** to save the original file.

Messages preserve line breaks, indentation, and Markdown text as written.

## Troubleshooting

**No attempts found:** Check that you selected `runs/` or `adaptive-predicate-ordering/`, and that files are inside each model’s `prior/` folder with names such as `attempt-01-trajectory.json`.

**An attempt cannot be opened:** The file must contain valid trajectory JSON with a `steps` array of step objects. Other attempts can still be viewed.

**Files changed on disk:** Select the folder again to load the updated files.

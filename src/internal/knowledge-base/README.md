# Internal Knowledge Base Publishing

The internal publishing API is mounted at `/api/internal/knowledge-base`. The enclosing `/api/internal` router authenticates the internal bearer token; this module then loads the authenticated user's current saved role menu before every request.

- `GET /guides`: list drafts and published guides, categories, and current permissions.
- `GET /guides/:id/file`: preview a PDF, including a draft.
- `POST /guides`: upload a PDF with `title`, `description`, `category`, and `published`.
- `PUT /guides/:id`: update metadata and optionally replace the PDF; include `updatedAt`.
- `PATCH /guides/:id/visibility`: change `published`; include `updatedAt`.
- `DELETE /guides/:id`: permanently remove the record and PDF; include `updatedAt`.

View permission is required for listing and previewing. Add, Edit, and Delete permissions protect their corresponding mutations. Explicit role-menu denials apply to administrators as well.

Guide metadata uses the production CMMS database's `knowledge_base_guides` collection so the customer-facing CMMS API reads the same records. Every PDF is stored under the same generated filename in both of these default directories:

- `INTERNAL_API/uploadFiles/knowledge_base`
- `CMMS_API/uploadFiles/knowledge_base`

Set `KNOWLEDGE_BASE_FILES_DIR` to override the primary directory and `KNOWLEDGE_BASE_MIRROR_FILES_DIR` to override the CMMS mirror directory. `INTERNAL_API` requires read/write access to both locations. If `CMMS_API` reads files through its knowledge-base service, set that project's `KNOWLEDGE_BASE_FILES_DIR` to its mirrored `uploadFiles/knowledge_base` directory.

PDFs must have a `.pdf` filename, a PDF signature, and a size of at most 20 MB. File replacement and deletion use the submitted `updatedAt` value for optimistic concurrency; conflicts return 409. Uploads and replacements stage both copies before changing the database. Failed file or database writes clean up the newly staged filename from both directories and leave the previous PDF intact. Successful replacement and deletion remove the previous filename from both directories.

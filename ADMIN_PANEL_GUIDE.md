# 📚 Admin Panel - PDF Upload & RAG Integration

## ✅ **Feature Implemented**

A fully functional Admin Panel for managing the knowledge base. You can now upload PDF documents, tag them with a subject, and automatically index them into Pinecone for RAG-based question generation.

---

## 🛠️ **How It Works**

### **1. Frontend (Admin Console)**
- **URL**: `http://localhost:3000/admin`
- **Interface**:
  - **Subject Selector**: Choose from Physics, Chemistry, Mathematics, Biology, General.
  - **File Drop Zone**: Drag & drop or click to select PDF files.
  - **Upload Button**: Triggers the upload and indexing process.
  - **Status Feedback**: Shows success/error messages and processing state.

### **2. Backend (RAG Service)**
- **Endpoint**: `POST /upload-document`
- **Process**:
  1.  **Receives File**: Accepts the PDF file and the selected subject.
  2.  **Loads PDF**: Uses `PyPDFLoader` to extract text from the PDF.
  3.  **Chunks Text**: Splits text into manageable chunks (1000 chars with 200 overlap).
  4.  **Embeds**: Generates vector embeddings for each chunk using OpenAI `text-embedding-3-small`.
  5.  **Upserts to Pinecone**: Stores vectors with metadata:
      - `text`: The actual content chunk.
      - `source`: Filename.
      - `subject`: Selected subject (CRITICAL for filtering).
      - `page`: Page number.

---

## 🚀 **How to Use**

1.  **Navigate to Admin Panel**:
    Go to [http://localhost:3000/admin](http://localhost:3000/admin)

2.  **Select Subject**:
    Choose the subject that matches your document (e.g., "Physics").

3.  **Upload PDF**:
    Select a PDF textbook, chapter, or notes file.

4.  **Click "Upload & Index"**:
    The system will process the file. Wait for the "Successfully uploaded" message.

5.  **Verify**:
    Check the backend terminal to see the ingestion logs:
    ```
    INGESTING DOCUMENT:
      File: uploads/physics_chapter1.pdf
      Subject: Physics
    ...
    ✅ Successfully ingested physics_chapter1.pdf
    ```

6.  **Generate Questions**:
    Go to the Dashboard and generate questions for that subject. The system will now use your uploaded document!

---

## ⚠️ **Important Notes**

- **File Type**: Currently supports **PDF** files.
- **File Size**: Keep files reasonable (under 50MB recommended).
- **Processing Time**: Large files may take a few seconds to embed and index.
- **RAG-ONLY Mode**: Remember that question generation now **strictly** requires these uploaded documents.

---

## 🧪 **Testing**

1.  Upload a PDF for "Physics".
2.  Go to Dashboard.
3.  Generate "Physics" questions.
4.  Verify the questions come from your PDF content.

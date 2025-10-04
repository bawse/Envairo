## 3. Research Navigator & Voice‑Enabled Paper Summarizer

### Core concept

Help researchers quickly assess and interact with academic papers by providing automated summaries, relevance checks and voice‑driven queries. Users can ask questions about the paper and receive concise answers and guidance without reading the entire document.

### Implementation outline

1. **Text extraction and detection**

   * The extension identifies when a PDF or HTML paper is loaded in the browser. Using a content script and PDF‑parsing library, it extracts sections such as abstract, introduction, methods, and conclusion.
   * It also captures metadata (title, authors, keywords) to provide context.

2. **AI‑driven summarisation and relevance analysis**

   * Run the **Summarizer API** on each section to produce a structured summary (e.g., bullet points or key findings). This summarised view allows the user to gauge the paper’s relevance without reading it all.
   * Provide a relevance score by matching the user’s research topic (entered manually or spoken aloud) against the summarised content using a simple similarity metric (e.g., TF‑IDF or embedding cosine similarity). If the score is low, the extension can inform the user that the paper may not be relevant.

3. **Voice‑interactive Q&A**

   * Similar to the language‑learning companion, integrate the **Web Speech API** for voice input and output. After loading a paper, the user can ask questions like “What is the main contribution?” or “Does this paper study transfer learning?”
   * Convert the spoken question to text, then call the **Prompt API** with a prompt instructing Gemini to answer based on the extracted text. For example: “Given the following abstract and introduction, answer the user’s question…” followed by the extracted sections.
   * Read the answer back to the user via speech synthesis and highlight or scroll to the relevant section in the paper.

4. **Simplification and translation**

   * If the user finds a section hard to understand, they can select it and invoke the **Rewriter API** to get a simplified explanation (e.g., “Explain this paragraph in plain language”) or to expand on technical jargon.
   * The **Translator API** makes the summarised content available in other languages, broadening accessibility for international researchers.

5. **Feasibility notes**

   * The Summarizer is well‑suited for condensing long texts; however, very long papers may need to be processed in chunks due to token limits. Chunking logic and simple caching can handle this.
   * Speech recognition and synthesis are not part of the built‑in AI but are provided by the Web Speech API; combining them with the built‑in AI models is allowable.
   * A solo developer can start with basic summarisation and Q&A for PDFs and gradually add features like relevance scoring and question‑driven navigation.

### Alignment with hackathon

This idea modernises literature review by combining summarisation, translation, rewriting, the Prompt API and voice interaction. It demonstrates strong **Purpose** (saves time in research), **Functionality** (works across many papers and languages), and **Technological Execution** by orchestrating multiple built‑in APIs and the Web Speech API. A polished, interactive UI with clear feedback will satisfy **Content** and **User Experience** criteria.

---
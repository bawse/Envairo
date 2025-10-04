
## 1. Sustainable Shopping Advisor

### Core concept

Provide shoppers with a **sustainability and recyclability score** for products they view online. This score would be calculated from information on the product page (materials, recyclability notes, certifications, etc.) using client‑side AI and displayed in an unobtrusive overlay. The user could click the overlay for a detailed breakdown and an explanation of how the score was determined.

### Implementation outline

1. **DOM extraction via content scripts**
   When the user visits a product page (e.g., on Amazon or another retailer), the extension’s content script scans the page for the product title, materials section, ingredients list, packaging details, and any sustainability statements. It also looks for common keywords (e.g., “recycled”, “organic”, “100% cotton”, “PET bottle”) and structured data (schema.org attributes).

2. **AI‑powered summarisation and interpretation**

   * Use the **Summarizer API** to condense the extracted text into concise bullet points covering the materials used and any environmental claims.
   * Use the **Language Detector** and **Translator API** to handle pages in other languages. The translator can convert the key data into English (or the user’s language) before scoring.
   * Optionally, use the **Writer API** to draft a plain‑language explanation of why certain materials are considered more sustainable (e.g., “organic cotton reduces pesticide use”) and to generate recommendations for more sustainable alternatives when available.

3. **Scoring algorithm**

   * Implement a simple rule‑based system on top of the AI’s summary. Each material or claim is mapped to a set of sustainability/recyclability weights. For instance, “100% recycled PET” might score high for recyclability; “PVC” might score low because it’s hard to recycle.
   * Combine these weights into a single score (0–10) with colour‑coded feedback (red for poor sustainability, green for good). The algorithm can be fine‑tuned via configuration files and improved over time.

4. **User interface**

   * A floating, translucent panel appears when a product page loads, showing the score and a brief summary. Clicking it expands a detailed view that lists the detected materials, the AI‑generated explanation, and any warnings (e.g., “contains microplastics”).
   * To keep the UI accessible to a broad audience, you might incorporate large fonts and simple icons. The panel can optionally use a “glass” effect like iOS 26 by applying `backdrop-filter: blur(...)` and semi‑transparent backgrounds.

5. **Feasibility notes**

   * All AI processing can run locally, preserving privacy. The summariser and writer are designed to work on short text segments; product pages generally meet this requirement.
   * The algorithm doesn’t require external APIs (other than Chrome’s built‑in AI), so it remains within the hackathon’s constraints.
   * A solo developer can define an initial set of scoring rules and gradually expand coverage to more materials.

### Alignment with hackathon

This idea addresses the **Purpose** criterion by empowering consumers to make informed, eco‑friendly choices. It uses at least three built‑in AI APIs and demonstrates a creative application of AI. The overlay UI can be polished to meet **Content** and **User Experience** requirements, and the rule‑based scoring can scale to many products (supporting the **Functionality** and **Technological Execution** criteria).


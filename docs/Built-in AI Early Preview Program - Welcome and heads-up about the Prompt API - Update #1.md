**Prefer the [Origin Trial documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api) for the latest**, especially in a Chrome extension context.

| CHROME | Update \#1 |  |
| :---- | ----- | :---- |
| **Built-in AI Early Preview Program** *Welcome and about the Prompt API* | Authors | [Kenji Baheux](mailto:kenjibaheux@google.com) [Thomas Steiner](mailto:tsteiner@google.com) [Alexandra Klepper](mailto:alexandrawhite@google.com) |
|  | Contact | See [this section](#share-your-feedback) |
|  | Last-updated | May 15, 2025 See [changelog](#changelog). |

# **Latest news 📯**

* May 13, 2025 New namespace and API shape (see [PSA](https://groups.google.com/a/chromium.org/g/chrome-ai-dev-preview/c/ZoGd0DcMkaQ) for details). This doc and the latest Chrome Canary builds should reflect these changes but [reach out](#other-feedback) if there is anything that doesn’t work as intended.  
* Nov 12, 2024 Prompt API in Chrome Extensions available for live experimentation as an Origin Trial ([blog post](https://developer.chrome.com/blog/prompt-api-origin-trial); [technical documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api)).  
* Check [goo.gle/chrome-ai-dev-preview-index](http://goo.gle/chrome-ai-dev-preview-index) for the full list of updates\!

# **Intro**

Welcome, and thanks for participating in our Early Preview Program for built-in AI capabilities ([article](https://developer.chrome.com/docs/ai/built-in), [talk at Google I/O 2024](https://io.google/2024/explore/47fc6e98-8359-4be0-b9b9-4bc7b28bd063/), talks at Google I/O 2025: [web](https://io.google/2025/explore/technical-session-42), [Chrome Extensions](https://io.google/2025/explore/technical-session-41)). Your involvement is invaluable as we explore opportunities to improve or augment web experiences with AI\!

The Built-in AI Early Preview Program has several goals:

* **Listening:** We're eager to hear your feedback on early-stage APIs. Help us better understand the problems you’re trying to solve. This will ensure that we design the APIs you need, in the right way.  
* **Exploring:** We want to facilitate the discovery of promising applications for built-in AI, which will directly inform our roadmap and prioritization discussions.  
* **Supporting:** Your insights and interest will inform discussions with other browser vendors, as we work towards common standards for AI integration in web browsers.

| 📣 | Know of other folks who would love to join this program? Or perhaps you got access to this document from a friend?  [Sign up](#opt-in) to get the latest updates directly in your inbox. |
| :---: | :---- |

In this first update, we're excited to provide details about the Prompt API, designed to facilitate the discovery of AI use cases through local prototyping and for use cases not addressed by a dedicated task API (e.g. Summarizer, Translator, etC). More concretely, this API will let you directly interact with Gemini Nano, running on your device.

As we explore the possibilities of this technology together, it’s critical that we prioritize responsible AI development. To help guide our efforts, take a moment to review [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy). This policy outlines some key considerations for ethical and safe deployment of AI.

Let's learn and build together ✨\!

# **Prompt API**

## **Purpose**

The Prompt API is provided to facilitate the discovery of use cases for built-in AI, and for use cases that are not covered by dedicated task APIs. With this API, you can send natural language instructions to an instance of [Gemini Nano](https://deepmind.google/technologies/gemini/nano/) in Chrome.

While the Prompt API offers the most flexibility, it won’t necessarily deliver the best results and may not deliver sufficient quality in some cases. That’s why we believe that task-specific APIs (such as a [Translation API](https://github.com/WICG/translation-api)) paired with [fine tuning](https://cloud.google.com/blog/products/ai-machine-learning/to-tune-or-not-to-tune-a-guide-to-leveraging-your-data-with-llms) or expert models, will deliver significantly better results. Our hope for the Prompt API is that it helps accelerate the discovery of compelling use cases to inform a roadmap of task-specific APIs.

## **Timing**

The Prompt API is available, behind an experimental flag, from Chrome 127+ for desktop. 

* The experimental flag is available as of May 31, 2024 6:09 PM.  
* You’ll need **Version 128.0.6545.0 or above**.   
* We recommend using [Chrome Canary](https://www.google.com/chrome/canary/) or [Chrome Dev channel](https://www.google.com/chrome/dev/?extra=devchannel) to benefit from bug fixes and ensure that you are using the latest API shape and functionality.

## **Requirements**

Built-in AI is currently focused on desktop platforms. In addition, you must meet the [hardware requirements for Gemini Nano](https://developer.chrome.com/docs/ai/get-started#hardware).

| 🚧 | These are not necessarily the final requirements for Gemini Nano in Chrome. |
| :---: | :---- |
|  | **Not yet supported:**  Chrome for Android Chrome for iOS Chrome for ChromeOS |

## **Setup** {#setup}

### Prerequisites

1. Acknowledge [Google’s Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy).  
2. Download Chrome [Canary channel](https://www.google.com/chrome/canary/), and [confirm that your version](https://g.co/gemini/share/76832f6f8772) is equal or newer than 128.0.6545.0.  
3. Check that your device meets the [requirements](#heading=h.cwc2ewfrtynq).  
   * Don’t skip this step, in particular make sure that you have **at least 22 GB of free storage space**.  
   * If after the download the available storage space falls below 10 GB, the model will be **deleted again**. Note that some operating systems may report the actual free disk space differently, for example, by including or not disk space that's occupied by the trash bin. On macOS, use Disk Utility to get the representative free disk space.

### Enable Gemini Nano and the Prompt API

Follow these steps to enable Gemini Nano and the Prompt API [flags](https://developer.chrome.com/docs/web-platform/chrome-flags) for local experimentation:

1. Go to chrome://flags/\#prompt-api-for-gemini-nano  
2. Select Enabled  
3. Relaunch Chrome.

### Confirm availability of Gemini Nano

1. Open DevTools and send (await LanguageModel.availability(); in the console.   
2. If this returns “available”, then you are all set. 

If this fails, continue as follows:

1. 📣🆕Force Chrome to recognize that you want to use this API. To do so, open DevTools and send  await LanguageModel.create(); in the console. This will likely fail but it’s intended.  
2. Relaunch Chrome.   
3. Open a new tab in Chrome, go to chrome://components   
4. Confirm that Gemini Nano is either available or is being downloaded  
   * You'll want to see the Optimization Guide On Device Model present with a version greater or equal to **2024.5.21.1031.**  
   * If there is no version listed, click on Check for update to force the download.  
5. Once the model has downloaded and has reached a version greater than shown above, open DevTools and send (await LanguageModel.availability(); in the console. If this returns “available”, then you are all set.   
   * Otherwise, relaunch, wait for a little while, and try again from step 1\. 

If this still fails, please see the [troubleshooting section](#last-resort-troubleshooting).

## **Demo**

With the Prompt API enabled, head over to this Chrome Dev Playground to try it out:

* [https://chrome.dev/web-ai-demos/prompt-api-playground/](https://chrome.dev/web-ai-demos/prompt-api-playground/) ([code](https://github.com/tomayac/prompt-api-playground))

| ![][image1] |
| ----- |
| *The Prompt API in action* |

## **API overview**

| 💡 | *TypeScript type definitions for the Built-in AI APIs are available as part of the DefinitelyTyped APIs, in the [@types/dom-chromium-ai package](https://www.npmjs.com/package/@types/dom-chromium-ai).* |
| :---: | :---- |

### Sample code

#### At once version

```javascript
// Start by checking if it's possible to create a session based on the availability of the model, and the characteristics of the device.
const {available, defaultTemperature, defaultTopK, maxTopK } = await LanguageModel.params();

if (available !== "no") {
  const session = await LanguageModel.create();

  // Prompt the model and wait for the whole result to come back.  
  const result = await session.prompt("Write me a poem");
  console.log(result);
}
```

#### Streaming version

```javascript
const {available, defaultTemperature, defaultTopK, maxTopK } = await LanguageModel.availability();

if (available !== "unavailable") {
  const session = await LanguageModel.create();

  // Prompt the model and stream the result:
  const stream = session.promptStreaming("Write me an extra-long poem");
  for await (const chunk of stream) {
    console.log(chunk);
  }
}
```

### Tracking model download progress

```javascript
const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener("downloadprogress", e => {
      console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
    });
  }
});
```

### Session persistence

Each session keeps track of the context of the conversation.

```javascript
const session = await LanguageModel.create({
  systemPrompt: "You are a friendly, helpful assistant specialized in clothing choices."
});

const result = await session.prompt(`
  What should I wear today? It's sunny and I'm unsure between a t-shirt and a polo.
`);

console.log(result);

const result2 = await session.prompt(`
  That sounds great, but oh no, it's actually going to rain! New advice??
`);
```

### Session cloning

To preserve resources, you can clone an existing session. The conversation context will be reset, but the initial prompt or the system prompts will remain intact.

```javascript
const clonedSession = await session.clone();
```

### Session options

Each session can be customized with [topK and temperature](https://g.co/gemini/share/a4665036f4b9). The default values for these parameters are returned from LanguageModel.params().

```javascript
const capabilities = await LanguageModel.params();
// Initializing a new session must either specify both topK and temperature, or neither of them.
const slightlyHighTemperatureSession = await LanguageModel.create({
  temperature: Math.max(capabilities.defaultTemperature * 1.2, 1.0),
  topK: capabilities.defaultTopK,
});
```

### System prompts

Give the language model some context.

```javascript
const session = await LanguageModel.create({
  systemPrompt: "Pretend to be an eloquent hamster."
});
await session.prompt('Do you like nuts?');
// ' As a hamster of unparalleled linguistic ability, I find myself quite adept at responding to the question of whether or not I enjoy the consumption of delectable nuts. Nutty delight indeed!'
```

### Session information {#session-information}

A given language model session will have a maximum number of tokens it can process. Developers can check their current usage and progress toward that limit by using the following properties on the session object:

```javascript
console.log(`${session.tokensSoFar}/${session.maxTokens} (${session.tokensLeft} left)`);
```

### Terminating a session 

Call destroy() to free resources if you no longer need a session. When a session is destroyed, it can no longer be used, and any ongoing execution will be aborted. You may want to keep the session around if you intend to prompt the model often since creating a session can take some time.

```javascript
await session.prompt(`
  You are a friendly, helpful assistant specialized in clothing choices.
`);

session.destroy();

// The promise will be rejected with an error explaining that the session is destroyed.
await session.prompt(`
  What should I wear today? It's sunny and I'm unsure between a t-shirt and a polo.
`);
```

### Exceptions

The Prompt API may receive errors from the AI runtime. See [this section](#full-list-of-exceptions) for a list of possible errors, and how they are mapped into DOMExceptions.

### Caveats

#### Streaming

promptStreaming() returns a ReadableStream where the chunks are successive pieces of a single long stream. This means the output would be a sequence like "Hello", " world", " I am", " an AI". 

#### Enterprise

This API will not work if [GenAILocalFoundationalModelSettings](https://chromeenterprise.google/policies/#GenAILocalFoundationalModelSettings) is set to “Do not download model”.

* You can check this setting from chrome://policy.

# **Prompt 101**

To write the best prompts, we recommend reading the following:

* [People \+ AI guidebook](https://pair.withgoogle.com/guidebook/patterns) which talks about the *if*, *when*, and *how* to use AI (including UX examples).  
* [Prompt design strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) which gives concrete guidance on how to best prompt an LLM. 

In addition, here are our recommendations for Gemini Nano in Chrome.

| DOs |  | DONTs |  |
| ----- | ----- | ----- | ----- |
| **Include examples to guide your prompt.** One example, or one shot prompting, is better than no examples. Few shot prompting is best in guiding the model to return your intended results. |  | **Avoid use cases with right or wrong answers.**The model might be too small to answer correctly knowledge questions, and may also struggle with tasks that depend on getting the perfect answer. Design your feature or UX with these imperfections in mind. |  |
| **Add rules.** You can improve the quality of the output by adding rules in your prompt.  Examples: “Respond in a friendly tone”, “Use the category ‘ambiguous’ if it’s unclear”, “Do not provide any explanation.” |  | **Avoid use cases that bypass the user.** LLMs may not always have a satisfying response. So, it’s better to position your AI feature as a tool to support the user in their tasks (e.g. generating a list of potential keywords that the user can quickly review and adjust). |  |
| **Add a persona.** This can help the model return something that’s more aligned to your needs. Example: “You just bought a product, and are writing a review for said product. Please rephrase \[...\]” |  | **Avoid customizing the parameters**. While it’s possible to change the parameters (such as temperature and topK), we strongly recommend that you keep the default values unless you’ve run out of ideas with the prompt or you need the model to behave differently. |  |
| *(Non-English)*  **Specify the output language.** If you prompt the model in English but need a non-English response, specify the output language in the prompt.  Example: “Please rephrase the following sentence in Spanish. Hola, cómo estás”. |  |  |  |
| **Use AI capabilities responsibly.** Generative AI models can help you or your users be more productive, enhance creativity and learning. We expect you to use and engage with this technology in accordance with [Google’s Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy). |  |  |  |

### Emulating stop sequences

The model doesn't support stop sequences natively, but you can emulate them as follows.

```
const abortController = new AbortController();
const signal = abortController.signal;

const STOP_SEQUENCES = ['world'];

const languageModel = await LanguageModel.create();
const stream = await languageModel.promptStreaming('Say "Hello, world!"', {
  signal,
});

let previousLength = 0;
streamingLoop: for await (const chunk of stream) {
  const newContent = chunk.slice(previousLength);
  console.log(`Chunk: "${newContent}"`);
  for (const stopSequence of STOP_SEQUENCES) {
    if (newContent.toLowerCase().includes(stopSequence.toLowerCase())) {
      console.log(
        `Stop sequence "${stopSequence}" found in chunk "${newContent}". Aborting.`
      );
      abortController.abort();
      break streamingLoop;
    }
  }
  document.body.insertAdjacentText('beforeEnd', newContent);
  previousLength = chunk.length;
}
```

# **Share your feedback** {#share-your-feedback}

### Surveys

We’ll send surveys on an ongoing basis to get a sense of how the APIs and the task-specific APIs approach is working, to collect signals about popular use cases, issues, etc.

### Feedback form for quality or technical issues {#feedback-form-for-quality-or-technical-issues}

If you experience quality or technical issues, consider [sharing details](https://goo.gle/chrome-ai-dev-preview-feedback-quality). Your reports will help us refine and improve our models, APIs, and components in the AI runtime layer, to ensure safety and responsible use.

* Handy shortlink: goo.gle/chrome-ai-dev-preview-feedback-quality

### Feedback about Chrome’s behavior / implementation of the Prompt API

If you want to report bugs or other  issues related to Chrome’s behavior / implementation of the Prompt API, provide as many details as possible (e.g. repro steps) in a [public chromium bug report](https://issues.chromium.org/u/1/issues/new?component=1583624&template=0).

### Feedback about the APIs

If you want to report ergonomic issues or other problems related to one of the built-in AI APIs, see if there is any related issue first and if not then file a public spec issue:

* [Prompt API spec issues](https://github.com/explainers-by-googlers/prompt-api/issues)  
* [Translation API spec issues](https://github.com/WICG/translation-api/issues)

### Other feedback {#other-feedback}

For other questions or issues, reach out directly by sending an email to [the mailing list owners](mailto:chrome-ai-dev-preview+owners@chromium.org) (chrome-ai-dev-preview**\+owners**@chromium.org). We’ll do our best to be as responsive as possible or update existing documents when more appropriate (such as adding to the [FAQ section](#faq)).

# **FAQ** {#faq}

## **Participation in the Early Preview Program**

### Opt-out and unsubscribe

To opt-out from the Early Preview Program, simply send an email to:

* [chrome-ai-dev-preview+unsubscribe@chromium.org](mailto:chrome-ai-dev-preview+unsubscribe@chromium.org).

### Opt-in {#opt-in}

If you know someone who would like to join the program, ask them to fill up the sign-up form at:

* goo.gle/chrome-ai-dev-preview-join

## **Non-English language support**

The latest model version of Gemini Nano has only thoroughly been tested for quality (e.g., its responses should be factually correct and well written) and security (it should not tell you dangerous things, like how to build a bomb) with English. We're working on lifting this limitation soon. There will be a flag that allows you to bypass the limitation for local testing, but it's not working reliably yet, [tracked in this CL](https://chromium-review.googlesource.com/c/chromium/src/+/5913533/2/chrome/browser/about_flags.cc#1177). 

## **Compatibility issue on macOS**

The use of Rosetta to run the x64 version of Chromium on ARM is neither tested nor maintained, and unexpected behavior will likely result. Please check that all tools that spawn Chromium are ARM-native.

## **Output quality**

The current implementation of the Prompt API is primarily for experimentation and may not reflect the final output quality when integrated with task APIs we intend to ship.

That said, if you see the model generates harmful content or problematic responses, we encourage you to [share feedback on output quality](#feedback-form-for-quality-or-technical-issues). Your reports are invaluable in helping us refine and improve our models, APIs, and components in the AI runtime layer, to ensure safety and responsible use.

## **What happens when the number of tokens in the prompt exceeds the context window?**

The current design only considers the last N tokens in a given input. Consequently, providing too much text in the prompt, may result in the model ignoring the beginning portion of the prompt. For example, if the prompt begins with "Translate the following text to English:...", preceded by thousands of lines of text, the model may not receive the beginning of the prompt and thus fail to provide a translation.

## **Some prompts stop when using stream execution.**

[Let us know](#feedback-form-for-quality-or-technical-issues) if you can reproduce the issue: prompt, session options, details about the device, etc. In the meantime, restart Chrome and try again.

## **Last resort troubleshooting** {#last-resort-troubleshooting}

### Uncaught NotSupportedError: … untested language …

If you frequently encounter the following error, or if it appears with text that shouldn't be problematic, try disabling the Text Safety classifier in Chrome's flags settings: chrome://flags/\#text-safety-classifier

* Uncaught NotSupportedError: The model attempted to output text in an untested language, and was prevented from doing so

### Alternative steps

Some participants have reported that the following steps helped them get the component to show up:

* If you want to try the API on a device that doesn't have the performance or VRAM requirement (i.e., when capabilities() \=== 'no'), you can override it by setting the flag \#optimization-guide-on-device-mode to  "Enabled BypassPerfRequirement", then retry the [setup steps](https://docs.google.com/document/d/1VG8HIyz361zGduWgNG7R_R8Xkv0OOJ8b5C9QKeCjU0c/edit?pli=1#heading=h.witohboigk0o). This comes with the caveat that, while the model may be able to run, it may also fail to execute with generic failure errors.

### Model download delay

The browser may not start downloading the model right away. If your computer fulfills all the requirements and you don't see the model download start on chrome://components after calling LanguageModel.create(), and *Optimization Guide On Device Model* shows *version 0.0.0.0 / New*, leave the browser open for a few minutes to wait for the scheduler to start the download.

### Debug logs

If everything fails:

1. Open a new tab  
2. Go to chrome://gpu  
3. Download the gpu report  
4. Go to chrome://histograms/\#OptimizationGuide.ModelExecution.OnDeviceModelInstallCriteria.AtRegistration.DiskSpace  
   * If you see records for 0, it means that your device doesn’t have enough storage space for the model. Ensure that you have at least 22 GB on the disk with your user profile, and retry the [setup steps](#setup). If you are still stuck, continue with the other steps below.  
     ![][image2]  
     On qualifying systems, the histogram should look similar to the following example:

     \- Histogram: OptimizationGuide.ModelExecution.OnDeviceModelInstallCriteria.AtRegistration.DiskSpace recorded 1 samples, mean \= 1.0 (flags \= 0x41) \[\#\]

5. Go to chrome://histograms/\#OptimizationGuide and download the histograms report  
6. [Share both reports with the Early Preview Program coordinators](#other-feedback).

### Crash logs

If you encounter a crash error message such as “the model process crashed too many times for this version.”, then we’ll need a crash ID to investigate the root causes.

1. Ensure that you have [enabled crash reporting](https://support.google.com/chrome/answer/96817?hl=en&co=GENIE.Platform%3DDesktop#zippy=%2Ccomputer).  
2. Reproduce the issue.  
3. Go to chrome://crashes  
4. Find the most recent crash  
   1. Hit Send now if necessary.  
   2. Then wait and reload until the Status line changes from Not uploaded to Uploaded. Note that this could take a while.  
5. Copy the ID next to the Uploaded Crash Report ID  line.  
6. [Share the ID with the Early Preview Program coordinators](#other-feedback).

In the meantime, you’ll need to wait for a new Chrome version to get another chance of trying the Prompt API.

# **Appendix**

## **Full API surface**

The full API surface is described below. See [Web IDL](https://webidl.spec.whatwg.org/) for details on the language. The current implementation is a work in progress and does not support everything described below.

```
[Exposed=(Window,Worker), SecureContext]
interface LanguageModel : EventTarget {
  static Promise<LanguageModel> create(optional LanguageModelCreateOptions options = {});
  static Promise<Availability> availability(optional LanguageModelCreateCoreOptions options = {});
  static Promise<LanguageModelParams?> params();

  // These will throw "NotSupportedError" DOMExceptions if role = "system"
  Promise<DOMString> prompt(
    LanguageModelPrompt input,
    optional LanguageModelPromptOptions options = {}
  );
  ReadableStream promptStreaming(
    LanguageModelPrompt input,
    optional LanguageModelPromptOptions options = {}
  );
  Promise<undefined> append(
    LanguageModelPrompt input,
    optional LanguageModelAppendOptions options = {}
  );

  Promise<double> measureInputUsage(
    LanguageModelPrompt input,
    optional LanguageModelPromptOptions options = {}
  );
  readonly attribute double inputUsage;
  readonly attribute unrestricted double inputQuota;
  attribute EventHandler onquotaoverflow;

  readonly attribute unsigned long topK;
  readonly attribute float temperature;

  Promise<LanguageModel> clone(optional LanguageModelCloneOptions options = {});
  undefined destroy();
};

[Exposed=(Window,Worker), SecureContext]
interface LanguageModelParams {
  readonly attribute unsigned long defaultTopK;
  readonly attribute unsigned long maxTopK;
  readonly attribute float defaultTemperature;
  readonly attribute float maxTemperature;
};

dictionary LanguageModelCreateCoreOptions {
  // Note: these two have custom out-of-range handling behavior, not in the IDL layer.
  // They are unrestricted double so as to allow +Infinity without failing.
  unrestricted double topK;
  unrestricted double temperature;

  sequence<LanguageModelExpectedInput> expectedInputs;
};

dictionary LanguageModelCreateOptions : LanguageModelCreateCoreOptions {
  AbortSignal signal;
  AICreateMonitorCallback monitor;

  LanguageModelInitialPrompts initialPrompts;
};

dictionary LanguageModelPromptOptions {
  object responseConstraint;
  AbortSignal signal;
};

dictionary LanguageModelAppendOptions {
  AbortSignal signal;
};

dictionary LanguageModelCloneOptions {
  AbortSignal signal;
};

dictionary LanguageModelExpectedInput {
  required LanguageModelMessageType type;
  sequence<DOMString> languages;
};

// The argument to the prompt() method and others like it

typedef (
  // Canonical format
  sequence<LanguageModelMessage>
  // Shorthand per the below comment
  or sequence<LanguageModelMessageShorthand>
  // Shorthand for [{ role: "user", content: [{ type: "text", content: providedValue }] }]
  or DOMString
) LanguageModelPrompt;

// The initialPrompts value omits the single string shorthand
typedef (
  // Canonical format
  sequence<LanguageModelMessage>
  // Shorthand per the below comment
  or sequence<LanguageModelMessageShorthand>
) LanguageModelInitialPrompts;


dictionary LanguageModelMessage {
  required LanguageModelMessageRole role;
  required sequence<LanguageModelMessageContent> content;
};

// Shorthand for { role: providedValue.role, content: [{ type: "text", content: providedValue.content }] }
dictionary LanguageModelMessageShorthand {
  required LanguageModelMessageRole role;
  required DOMString content;
};

dictionary LanguageModelMessageContent {
  required LanguageModelMessageType type;
  required LanguageModelMessageContentValue content;
};

dictionary LanguageModelPromptDict {
  LanguageModelMessageRole role = "user";
  LanguageModelMessageType type = "text";
  required LanguageModelMessageContent content;
};

enum LanguageModelMessageRole { "system", "user", "assistant" };

enum LanguageModelMessageType { "text", "image", "audio" };

typedef (
  ImageBitmapSource
  or AudioBuffer
  or BufferSource
  or DOMString
) LanguageModelMessageContentValue;
```

## **Full list of exceptions** {#full-list-of-exceptions}

| Methods | DOMExceptions | Error messages |  | Comments |
| :---- | :---- | :---- | ----- | ----- |
| **All methods** | **InvalidStateError** | The execution context is not valid. |  | The JS context is invalid (e.g. a detached iframe). Remedy: ensure the API is called from a valid JS context.  |
| **create** | **OperationError** | Model execution service is not available. |  | Remedy: try again, possibly after relaunching Chrome. |
| **When streaming a response** | **UnknownError** | An unknown error occurred: \<error code\> |  | Remedy: retry, possibly after relaunching Chrome. [Report](#feedback-form-for-quality-or-technical-issues) a technical issue if you are stuck and/or can easily reproduce the problem. |
|  | **NotSupportedError** | The request was invalid. |  |  |
|  | **UnknownError** | Some other generic failure occurred. |  |  |
|  | **NotReadableError** | The response was disabled. |  |  |
|  | **AbortError** | The request was canceled. |  |  |
| **prompt, promptStreaming** | **InvalidStateError** | The model execution session has been destroyed. |  | This happens when calling prompt or promptStreaming after the session has been destroyed.   Remedy: create a new session. |
| **create** | **NotSupportedError** | Initializing a new session must either specify both topK and temperature, or neither of them. |  | This happens when the optional parameters are partially specified when calling create.   Remedy: You need to specify both topK and temperature parameters, or none at all, when calling create.   Use the values from defaultTextSessionOptions if you only want to change the value of one parameter. |
|  | **InvalidStateError** | The session cannot be created. |  | If capabilities' available returned "readily" then this should not happen.  Remedy: retry, possibly after relaunching Chrome. [Report](#feedback-form-for-quality-or-technical-issues) a technical issue if you are stuck and/or can easily reproduce the problem. |

## **Other updates**

Links to all previous updates and surveys we’ve sent can be found in [The Context Index](https://docs.google.com/document/d/18otm-D9xhn_XyObbQrc1v7SI-7lBX3ynZkjEpiS1V04/edit?usp=sharing) also available via goo.gle/chrome-ai-dev-preview-index

## **Changelog** {#changelog}

| Date | Changes |
| :---- | :---- |
| May 29, 2024 | Added details about the lack of support for Incognito. Added a note about GenAI Enterprise policy.  |
| May 30, 2024 | Added a note about storage footprint. Added a note about Worker support being limited to Dedicated Workers. |
| May 31, 2024 | Added a note about setting the system language to English (US) in the setup section (temporary requirement). Minor editorial changes to the flags URLs, the name of the Bypass Perf Requirements option, and the name of the Prompt API flag. Changed the target date to May 31st to reflect the latest estimate, although it’s still May 30th in Baker Islands as of the time of writing. Changed “yes” to “readily” to reflect the actual implementation. Added an explanation for BypassPerfRequirements. |
| Jun 1, 2024 | In the setup steps, clarified that the version can be *equal or* newer than 128.0.6545.0. |
| Jun 3, 2024 | Added chrome://histograms step in the troubleshooting guide. Added a reminder that prerequisites must be met, in particular the 22 GB storage space requirement. |
| Jun 6, 2024 | Added a note about *guest mode* not being supported. Bumped the minimum storage requirements to account for some OS reporting the remaining storage space in gibibytes. |
| Jun 9, 2024 | Splitting the sample code into the at-once version, and the streaming version. Added a code sample for setting the temperature and topK. Added a note about why keeping a session around is a good idea when the model is expected to be prompted often. |
| Jun 18, 2024 | Striked out the OS / Chrome language requirement. Updated support information for workers. Added a known issue in the troubleshooting section. Added a regression sidebar in the setup section. |
| Jun 25, 2024 | Updated ETA for regression fix making it to the dev channel: Jun 26, 2024 |
| Jun 26, 2024 | Updated latest status for the regression (fixed in latest Canary and Dev channels). |
| Jun 27, 2024 | Updated minimal version to be greater than the 128 release with the regression fix. Removed the regression sidebar table since it’s now resolved in the latest 128 version for both Dev and Canary. |
| Jun 28, 2024 | Added a requirement for the network connection type. Updated the steps to take into a recent change requiring the use of await ai.createTextSession(); to register the desire to use the Prompt API as a condition to trigger the model download. |
| Jun 28, 2024 | Added screenshot for OptimizationGuide.ModelExecution.OnDeviceModelInstallCriteria.AtRegistration.DiskSpace histogram and deeplinked it. |
| Jun 29, 2024 | Added a troubleshooting sub-section for reporting crash issues. |
| Jul 1, 2024 | Added alternative steps in the troubleshooting section based on a report by a participant. |
| Jul 9, 2024 | Added a note that the disk storage requirement is tied to where the user profile lives. |
| Jul 11, 2024 | Added “Other updates” section with a link to an index document pointing to all docs and surveys we’ve sent thus far. Added a note about what to do upon encountering the “too many crashes for this version” error. |
| Jul 19, 2024 | Added a note about support for session persistence from Chrome 128.0.6602.0. Added links for reporting implementation issues, and spec issues. |
| Jul 25, 2024 | Updated status for session persistence. Noted a fix for the “BAD MESSAGE” crasher. |
| Aug 8, 2024 | Announcement of two new Task APIs available for local experimentation: summarization and language detection. Updated info about support for session persistence and cloning. Updated info about how to change session parameters (temperature and topK). |
| Aug 9, 2024 | Minor tweak to debug logs section to point folks to the full list of histograms when sharing a report. Added a note about how to check for group policy state. |
| Aug 20, 2024 | Added note about model deletion if less than 10 GB of storage remains some time later after an initial successful model download.  |
| Aug 21, 2024 | Heads up about breaking changes in Chrome Canary for the Prompt API. |
| Aug 27, 2024 | Updated the whole doc to reflect the latest shape and functionality in Chrome canary.  |
| Aug 28, 2024 | Updated two links that pointed to a staging version of the present doc. |
| Aug 29, 2024 | Added an [important caveat about maxToken](#session-information). |
| Sep 30, 2024 | Added an approach to emulate stop sequences.  Added information on how a qualifying histogram should look like. |
| Oct 12, 2024 | Removed control sequence sections since system prompts, N-shots, etc are now taken care of behind the scenes via the API (e.g. see [this section of the explainer](https://github.com/explainers-by-googlers/prompt-api?tab=readme-ov-file#system-prompts)). |
| Oct 15, 2024 | Updated the document with the new namespace (`assistant` ⇒ `languageModel`) and reflected the changes in the IDL as well. |
| Oct 31, 2024 | Added FAQ entry about non-English language support. |
| Nov 6, 2024 | Updated the `ReadableStream` processing function to work with the non-standard and the standard behavior. |
| Nov 28, 2024 | Removed the caveat about the 1,024 tokens prompt limitation. |
| Dec 5, 2024 | Added info about the text safety flag. |
| Jan 10, 2025 | Removed the \#optimization-guide-on-device-mode flag requirement. |
| Apr 28, 2025 | Update to the new namespace. |
| May 13, 2025 | Top level heads-up on changes to the namespace and API shape \+ link to contact info in case of discrepancies. Adjusted the framing of this API which started as a purely exploratory API and has gradually moved into a valuable API complementing the array of task APIs. Removed the caveat about the promptStreaming function not working as originally intended (i.e. it used to resend the whole sequence, not just the new chunks; this has been fixed in recent Chrome releases). Links to relevant talks at Google I/O 2025\. |
| May 15, 2025 | Simplified hardware requirements section. Removed caveats about Incognito and Guest mode (now both are supported). |

## 

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>
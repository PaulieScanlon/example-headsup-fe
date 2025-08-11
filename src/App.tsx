import { useEffect, useState, useRef, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { mastraClient } from "./lib/mastra-client";

function App() {
  const [input, setInput] = useState("");
  const [workflow, setWorkflow] = useState<any>(null);
  const [workflowRun, setWorkflowRun] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; id: string }>>([]);
  const [gameWon, setGameWon] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to add initial workflow message
  const addInitialMessage = useCallback((result: any) => {
    const suspendedSteps = (result as any).suspended?.[0] || [];
    for (const stepName of suspendedSteps) {
      const step = result.steps[stepName];
      if (step?.suspendPayload?.message) {
        setChatMessages([
          {
            role: "assistant" as const,
            content: step.suspendPayload.message,
            id: crypto.randomUUID()
          }
        ]);
        break;
      }
    }
  }, []);

  // Helper function to create message objects
  const createMessage = useCallback(
    (role: "user" | "assistant", content: string) => ({
      role,
      content,
      id: crypto.randomUUID()
    }),
    []
  );

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const startWorkflow = async () => {
      const workflowInstance = await mastraClient.getWorkflow("headsUpWorkflow");
      setWorkflow(workflowInstance);

      const run = await workflowInstance.createRunAsync();
      setWorkflowRun(run);

      const result = await workflowInstance.startAsync({
        runId: run.runId,
        inputData: {
          start: true
        }
      });

      // Add the initial workflow message to chat
      addInitialMessage(result);
    };

    startWorkflow();
  }, []);

  const resetGame = async () => {
    // Clear all game state
    setChatMessages([]);
    setWorkflowRun(null);
    setGameWon(false);
    setInput("");

    // Start a new workflow
    const run = await workflow.createRunAsync();
    setWorkflowRun(run);

    const result = await workflow.startAsync({
      runId: run.runId,
      inputData: {
        start: true
      }
    });

    // Add the initial workflow message to chat
    addInitialMessage(result);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !workflowRun) return;

    // Add user message to chat
    setChatMessages((prev) => [...prev, createMessage("user", input)]);
    setInput("");

    // Resume the workflow with the user's input
    const result = await workflow.resumeAsync({
      runId: workflowRun.runId,
      step: "question-step",
      resumeData: {
        userMessage: input
      }
    });

    // Add the workflow's response to chat
    const suspendedSteps = (result as any).suspended?.[0] || [];
    let suspendedMessage = null;
    for (const stepName of suspendedSteps) {
      const step = result.steps[stepName];
      if (step?.suspendPayload?.message) {
        suspendedMessage = step.suspendPayload.message;
        break;
      }
    }

    if (suspendedMessage) {
      setChatMessages((prev) => [...prev, createMessage("assistant", suspendedMessage)]);
    } else {
      // If no suspended message, the workflow should have completed
      // Check if we need to set game won state and get the win message
      if (result.status === "success") {
        setGameWon(true);

        // Get the win message from the question-step output
        const questionStep = result.steps["question-step"];
        const winGameStep = result.steps["win-game-step"];

        if (questionStep?.status === "success" && "output" in questionStep && questionStep.output?.agentResponse) {
          let winMessage = questionStep.output.agentResponse;

          // Add guess count if available
          if (winGameStep?.status === "success" && "output" in winGameStep && winGameStep.output?.guessCount) {
            winMessage += ` You got it in ${winGameStep.output.guessCount} guesses!`;
          }

          setChatMessages((prev) => [...prev, createMessage("assistant", winMessage)]);
        }
      }
    }
  };

  return (
    <main className="flex h-dvh flex-col p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Heads Up Game</h1>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-gray-50">
        {chatMessages.length === 0 ? (
          <p className="text-center text-gray-500">Starting the game...</p>
        ) : (
          chatMessages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === "user" ? "bg-blue-500 text-white" : "bg-white border border-gray-200"}`}>
                <div className="text-xs mb-1 opacity-70">{message.role === "user" ? "You" : "Game"}</div>
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      {gameWon ? (
        <div className="flex justify-center">
          <button onClick={resetGame} className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-bold hover:bg-green-600 transition-colors">
            Play Again!
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a yes/no question..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={!input.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Send
          </button>
        </form>
      )}
    </main>
  );
}

export default App;

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
  const workflowInitialized = useRef(false);

  // Helper function to add initial workflow message
  const addInitialMessage = (result: any) => {
    const suspendedSteps = (result as any).suspended?.[0] || [];
    for (const stepName of suspendedSteps) {
      const step = result.steps[stepName];

      if (step?.suspendPayload?.agentResponse) {
        setChatMessages([
          {
            role: "assistant" as const,
            content: step.suspendPayload.agentResponse,
            id: crypto.randomUUID()
          }
        ]);
        break;
      }
    }
  };

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
    if (workflowInitialized.current) return;

    const startWorkflow = async () => {
      workflowInitialized.current = true;

      const workflowInstance = await mastraClient.getWorkflow("headsUpWorkflow");
      setWorkflow(workflowInstance);

      const run = await workflowInstance.createRunAsync();

      const result = await workflowInstance.startAsync({
        runId: run.runId,
        inputData: {
          start: true
        }
      });

      setWorkflowRun(run);

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
      step: "game-step",
      resumeData: {
        userMessage: input
      }
    });

    // Add the workflow's response to chat
    const suspendedSteps = (result as any).suspended?.[0] || [];
    let suspendedMessage = null;
    for (const stepName of suspendedSteps) {
      const step = result.steps[stepName];
      if (step?.payload?.agentResponse) {
        suspendedMessage = step.payload.agentResponse;
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

        // Get the win message from the game-step output
        const gameStep = result.steps["game-step"];
        const winStep = result.steps["win-step"];

        if (gameStep?.status === "success" && "output" in gameStep && gameStep.output?.agentResponse) {
          let winMessage = gameStep.output.agentResponse;

          // Add guess count if available
          if (winStep?.status === "success" && "output" in winStep && winStep.output?.guessCount) {
            winMessage += ` You got it in ${winStep.output.guessCount} guesses!`;
          }

          setChatMessages((prev) => [...prev, createMessage("assistant", winMessage)]);
        }
      }
    }
  };

  return (
    <main className="flex h-dvh flex-col gap-4 p-4 text-zinc-100 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-4xl font-bold mb-0 text-zinc-100">Heads Up Game</h1>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
        {chatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-lg ${message.role === "user" ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-100"}`}>
              <div className="text-xs mb-1 opacity-70">{message.role === "user" ? "You" : "Game"}</div>
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {gameWon && (
        <div className="text-center">
          <button
            onClick={resetGame}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold enabled:hover:bg-green-700 disabled:bg-zinc-800 disabled:cursor-not-allowed"
          >
            Play Again!
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a yes/no question or make a guess..."
          className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={gameWon}
        />
        <button
          type="submit"
          disabled={!input.trim() || gameWon}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold enabled:hover:bg-green-700 disabled:bg-zinc-800 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </main>
  );
}

export default App;

import { useEffect, useState, useRef } from "react";
import { mastraClient } from "./lib/mastra-client";

function App() {
  const [input, setInput] = useState("");

  const [workflowRun, setWorkflowRun] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; id: string }>>([]);
  const [gameWon, setGameWon] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const startWorkflow = async () => {
      const workflow = await mastraClient.getWorkflow("headsUpWorkflow");

      const run = await workflow.createRunAsync();
      setWorkflowRun(run);

      const result = await workflow.startAsync({
        runId: run.runId,
        inputData: {
          start: true
        }
      });

      // Add the initial workflow message to chat
      const suspendedSteps = (result as any).suspended?.[0] || [];
      for (const stepName of suspendedSteps) {
        const step = result.steps[stepName];
        if (step?.suspendPayload?.message) {
          const assistantMessage = {
            role: "assistant" as const,
            content: step.suspendPayload.message,
            id: Date.now().toString()
          };
          setChatMessages([assistantMessage]);
          break;
        }
      }
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
    const workflow = await mastraClient.getWorkflow("headsUpWorkflow");
    const run = await workflow.createRunAsync();
    setWorkflowRun(run);

    const result = await workflow.startAsync({
      runId: run.runId,
      inputData: {
        start: true
      }
    });

    // Add the initial workflow message to chat
    const suspendedSteps = (result as any).suspended?.[0] || [];
    for (const stepName of suspendedSteps) {
      const step = result.steps[stepName];
      if (step?.suspendPayload?.message) {
        const assistantMessage = {
          role: "assistant" as const,
          content: step.suspendPayload.message,
          id: Date.now().toString()
        };
        setChatMessages([assistantMessage]);
        break;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !workflowRun) return;

    // Add user message to chat
    const userMessage = { role: "user" as const, content: input, id: Date.now().toString() };
    setChatMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Resume the workflow with the user's input
    const workflow = await mastraClient.getWorkflow("headsUpWorkflow");
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
      const assistantMessage = {
        role: "assistant" as const,
        content: suspendedMessage,
        id: Date.now().toString()
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } else {
      // Check if the workflow completed (game won)
      if (result.status === "success") {
        const finalStep = result.steps["win-game-step"];
        if (finalStep && finalStep.status === "success" && "output" in finalStep) {
          const winMessage = `🎉 Congratulations! You guessed correctly! The famous person was ${finalStep.output.famousPerson}. You got it in ${finalStep.output.guessCount} guesses!`;
          const assistantMessage = {
            role: "assistant" as const,
            content: winMessage,
            id: Date.now().toString()
          };
          setChatMessages((prev) => [...prev, assistantMessage]);
          setGameWon(true);
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

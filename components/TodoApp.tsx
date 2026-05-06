"use client";

import { useState, useEffect } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) setTodos(JSON.parse(saved));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos, mounted]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, completed: false },
    ]);
    setInput("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Todo App</h1>
        <p className="text-sm text-gray-400 mb-6">
          {mounted ? `${remaining} 件残っています` : ""}
        </p>

        {/* 入力フォーム */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="タスクを入力..."
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={addTodo}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            追加
          </button>
        </div>

        {/* Todo リスト */}
        {mounted && (
          <ul className="space-y-2">
            {todos.length === 0 && (
              <li className="text-center text-gray-400 text-sm py-8">
                タスクがありません
              </li>
            )}
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
                <span
                  className={`flex-1 text-sm ${
                    todo.completed
                      ? "line-through text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
                  aria-label="削除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 完了済みをまとめて削除 */}
        {mounted && todos.some((t) => t.completed) && (
          <button
            onClick={() => setTodos((prev) => prev.filter((t) => !t.completed))}
            className="mt-4 w-full text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            完了済みをすべて削除
          </button>
        )}
      </div>
    </div>
  );
}

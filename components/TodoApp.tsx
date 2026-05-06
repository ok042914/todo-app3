"use client";

import { useState, useEffect } from "react";
import { supabase, type Todo } from "@/lib/supabase";
import { VERSION } from "@/lib/version";

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();

    const channel = supabase
      .channel("todos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => fetchTodos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTodos = async () => {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setTodos(data);
    setLoading(false);
  };

  const addTodo = async () => {
    const text = input.trim();
    if (!text) return;
    const tempId = crypto.randomUUID();
    const optimistic: Todo = { id: tempId, text, completed: false, created_at: new Date().toISOString() };
    setTodos((prev) => [...prev, optimistic]);
    setInput("");
    const { data } = await supabase.from("todos").insert({ text, completed: false }).select().single();
    if (data) setTodos((prev) => prev.map((t) => (t.id === tempId ? data : t)));
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
    await supabase.from("todos").update({ completed: !completed }).eq("id", id);
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("todos").delete().eq("id", id);
  };

  const clearCompleted = async () => {
    const ids = todos.filter((t) => t.completed).map((t) => t.id);
    setTodos((prev) => prev.filter((t) => !t.completed));
    await supabase.from("todos").delete().in("id", ids);
  };

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-800">Todo App</h1>
          <span className="text-xs text-gray-300 mt-1">v{VERSION}</span>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          {loading ? "読み込み中..." : `${remaining} 件残っています`}
        </p>

        {/* 入力フォーム */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="タスクを入力..."
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            追加
          </button>
        </div>

        {/* Todo リスト */}
        <ul className="space-y-2">
          {!loading && todos.length === 0 && (
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
                onChange={() => toggleTodo(todo.id, todo.completed)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <span
                className={`flex-1 text-sm ${
                  todo.completed ? "line-through text-gray-400" : "text-gray-700"
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

        {/* 完了済みをまとめて削除 */}
        {todos.some((t) => t.completed) && (
          <button
            onClick={clearCompleted}
            className="mt-4 w-full text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            完了済みをすべて削除
          </button>
        )}
      </div>
    </div>
  );
}

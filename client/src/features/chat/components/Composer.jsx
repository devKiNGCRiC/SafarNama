import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Image as ImageIcon, Send, X } from "lucide-react";
import "../chat.scss";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

// Text + optional photo. `onTyping(true|false)` lets the thread tell the other person.
const Composer = ({ disabledReason, onSend, onTyping }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const input = useRef(null);
  const idle = useRef(null);
  const typing = useRef(false);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => clearTimeout(idle.current), []);

  const setTyping = (value) => {
    if (typing.current !== value) {
      typing.current = value;
      onTyping?.(value);
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    setTyping(true);
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setTyping(false), 2000);
  };

  const pickFile = (e) => {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    if (!IMAGE_TYPES.includes(chosen.type)) return toast.error("Only JPG, PNG or WEBP photos can be sent");
    if (chosen.size > MAX_BYTES) return toast.error("Photos must be 8 MB or smaller");
    setFile(chosen);
  };

  const submit = (e) => {
    e?.preventDefault();
    const value = text.trim();
    if (disabledReason || (!value && !file)) return;
    onSend({ text: value, file });
    setText("");
    setFile(null);
    clearTimeout(idle.current);
    setTyping(false);
  };

  if (disabledReason) return <div className="chat-composer disabled">{disabledReason}</div>;

  return (
    <form className="chat-composer" onSubmit={submit}>
      {file && (
        <div className="chat-attachment">
          <img src={preview} alt="" />
          <button type="button" aria-label="Remove photo" onClick={() => setFile(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      <div className="chat-inputrow">
        <button type="button" className="chat-iconbtn" aria-label="Add photo" onClick={() => input.current?.click()}>
          <ImageIcon size={20} />
        </button>
        <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} hidden onChange={pickFile} />
        <textarea
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          value={text}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
        />
        <button type="submit" className="chat-send" aria-label="Send" disabled={!text.trim() && !file}>
          <Send size={18} />
        </button>
      </div>
    </form>
  );
};

export default Composer;

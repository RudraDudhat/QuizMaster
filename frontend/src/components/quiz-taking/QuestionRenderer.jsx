import { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

/* ─── Shared inline style builders ──────────────────────── */
const styles = {
    optionBtn: (selected) => ({
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 18px',
        borderRadius: 14,
        cursor: 'pointer',
        border: '2px solid var(--color-border)',
        background: selected ? 'var(--color-primary)' : 'var(--color-bg-card)',
        color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
        boxShadow: selected ? '3px 3px 0 var(--color-border)' : '2px 2px 0 var(--color-border)',
        textAlign: 'left',
        transition: 'all 0.15s',
        outline: 'none',
        marginBottom: 10,
    }),
    radioCircle: (selected) => ({
        width: 20,
        height: 20,
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: 1,
        border: selected
            ? '6px solid var(--color-bg-card)'
            : '2px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        transition: 'all 0.15s',
    }),
    checkBox: (selected) => ({
        width: 20,
        height: 20,
        borderRadius: 5,
        flexShrink: 0,
        marginTop: 1,
        border: '2px solid var(--color-border)',
        background: selected ? 'var(--color-primary)' : 'var(--color-bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
        color: 'var(--color-text-inverse)',
        fontSize: 12,
        fontWeight: 700,
    }),
    tfBtn: (selected) => ({
        flex: 1,
        padding: '18px 24px',
        borderRadius: 12,
        cursor: 'pointer',
        border: '2px solid var(--color-border)',
        background: selected ? 'var(--color-primary)' : 'var(--color-bg-card)',
        color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
        fontSize: 17,
        fontWeight: 700,
        transition: 'all 0.18s',
        textAlign: 'center',
        boxShadow: selected
            ? '3px 3px 0 var(--color-border)'
            : '2px 2px 0 var(--color-border)',
    }),
    draggableItem: (isDragging) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        marginBottom: 8,
        border: '2px solid var(--color-border)',
        background: isDragging
            ? 'var(--color-primary-light)'
            : 'var(--color-bg-card)',
        opacity: isDragging ? 0.7 : 1,
        cursor: 'grab',
        transition: 'all 0.15s',
    }),
    reorderBtn: {
        width: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: '1px solid var(--color-border-soft)',
        background: 'var(--color-bg-card)',
        cursor: 'pointer',
        color: 'var(--color-text-subtle)',
    },
};

/* ─── MCQ Single ───────────────────────────────────────── */
function MCQSingle({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const sel = ans?.selectedOptionUuids ?? [];
    return (
        <div role="radiogroup" aria-label="Choose one option">
            {opts.map((opt) => {
                const selected = sel.includes(opt.uuid);
                return (
                    <button
                        key={opt.uuid}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        style={styles.optionBtn(selected)}
                        onClick={() =>
                            setAns((cur) => ({ ...cur, selectedOptionUuids: [opt.uuid] }))
                        }
                    >
                        <div style={styles.radioCircle(selected)} aria-hidden="true" />
                        <div style={{ flex: 1 }}>
                            <span
                                style={{
                                    fontSize: 15,
                                    lineHeight: 1.5,
                                    color: selected
                                        ? 'var(--color-text-inverse)'
                                        : 'var(--color-text-primary)',
                                }}
                            >
                                {opt.optionText}
                            </span>
                            {opt.mediaUrl && (
                                <img
                                    src={opt.mediaUrl}
                                    alt=""
                                    style={{ marginTop: 8, maxWidth: 240, borderRadius: 8 }}
                                />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

/* ─── MCQ Multi ────────────────────────────────────────── */
function MCQMulti({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const sel = ans?.selectedOptionUuids ?? [];
    const toggle = (uuid) => {
        const newSel = sel.includes(uuid)
            ? sel.filter((x) => x !== uuid)
            : [...sel, uuid];
        setAns((cur) => ({ ...cur, selectedOptionUuids: newSel }));
    };
    return (
        <div role="group" aria-label="Select all that apply">
            <p
                style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 12,
                    fontStyle: 'italic',
                }}
            >
                Select all that apply
            </p>
            {opts.map((opt) => {
                const selected = sel.includes(opt.uuid);
                return (
                    <button
                        key={opt.uuid}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        style={styles.optionBtn(selected)}
                        onClick={() => toggle(opt.uuid)}
                    >
                        <div style={styles.checkBox(selected)} aria-hidden="true">
                            {selected && '✓'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <span
                                style={{
                                    fontSize: 15,
                                    lineHeight: 1.5,
                                    color: selected
                                        ? 'var(--color-text-inverse)'
                                        : 'var(--color-text-primary)',
                                }}
                            >
                                {opt.optionText}
                            </span>
                            {opt.mediaUrl && (
                                <img
                                    src={opt.mediaUrl}
                                    alt=""
                                    style={{ marginTop: 8, maxWidth: 240, borderRadius: 8 }}
                                />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

/* ─── True / False ─────────────────────────────────────── */
function TrueFalse({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const trueOpt =
        opts.find((o) => String(o.optionText).toLowerCase() === 'true') || opts[0];
    const falseOpt =
        opts.find((o) => String(o.optionText).toLowerCase() === 'false') || opts[1];
    const val = ans?.booleanAnswer;

    const selectTF = (bool, opt) => {
        setAns((cur) => ({
            ...cur,
            booleanAnswer: bool,
            selectedOptionUuids: opt?.uuid ? [opt.uuid] : [],
        }));
    };

    return (
        <div
            role="radiogroup"
            aria-label="True or False"
            style={{ display: 'flex', gap: 16, marginTop: 8 }}
        >
            <button
                type="button"
                role="radio"
                aria-checked={val === true}
                style={styles.tfBtn(val === true)}
                onClick={() => selectTF(true, trueOpt)}
            >
                ✓ True
            </button>
            <button
                type="button"
                role="radio"
                aria-checked={val === false}
                style={styles.tfBtn(val === false)}
                onClick={() => selectTF(false, falseOpt)}
            >
                ✗ False
            </button>
        </div>
    );
}

/* ─── Free text answer ─────────────────────────────────── */
function TextAnswer({ ans, setAns, rows = 3, essay = false }) {
    return (
        <div>
            <textarea
                rows={rows}
                value={ans?.textAnswer ?? ''}
                onChange={(e) =>
                    setAns((cur) => ({ ...cur, textAnswer: e.target.value }))
                }
                placeholder={
                    essay
                        ? 'Write your essay answer here...'
                        : 'Type your answer here...'
                }
                aria-label={essay ? 'Essay answer' : 'Your answer'}
                style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid var(--color-border)',
                    borderRadius: 12,
                    fontSize: 15,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    lineHeight: 1.6,
                    background: 'var(--color-bg-card)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            {essay && (
                <p
                    style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        marginTop: 8,
                        fontStyle: 'italic',
                    }}
                >
                    📝 Essay answers are manually graded by your instructor.
                </p>
            )}
        </div>
    );
}

/* ─── Ordering ─────────────────────────────────────────── */
/** Includes mouse-drag AND keyboard-only reordering for a11y. */
function OrderingQuestion({ question, ans, setAns }) {
    const [items, setItems] = useState(() => {
        const opts = [...(question.options ?? [])].sort(
            (a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0)
        );
        if (ans?.orderedOptionUuids?.length) {
            const idxMap = Object.fromEntries(
                ans.orderedOptionUuids.map((uuid, i) => [uuid, i])
            );
            return [...opts].sort(
                (a, b) => (idxMap[a.uuid] ?? 999) - (idxMap[b.uuid] ?? 999)
            );
        }
        return opts;
    });
    const [dragging, setDragging] = useState(null);

    const commit = (next) => {
        setItems(next);
        setAns((cur) => ({ ...cur, orderedOptionUuids: next.map((x) => x.uuid) }));
    };

    const move = (from, to) => {
        if (to < 0 || to >= items.length) return;
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        commit(next);
    };

    return (
        <div>
            <p
                style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 12,
                    fontStyle: 'italic',
                }}
            >
                Drag items, or use the up/down buttons, to arrange in the correct order
            </p>
            <ol
                aria-label="Items to reorder"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
                {items.map((opt, i) => (
                    <li
                        key={opt.uuid}
                        draggable
                        onDragStart={() => setDragging(i)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (dragging === null || dragging === i) return;
                            const next = [...items];
                            const [moved] = next.splice(dragging, 1);
                            next.splice(i, 0, moved);
                            setDragging(i);
                            commit(next);
                        }}
                        onDragEnd={() => setDragging(null)}
                        style={styles.draggableItem(dragging === i)}
                    >
                        <GripVertical
                            size={16}
                            style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
                            aria-hidden="true"
                        />
                        <div
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 12,
                                flexShrink: 0,
                            }}
                            aria-hidden="true"
                        >
                            {i + 1}
                        </div>
                        <span style={{ flex: 1, fontSize: 15 }}>{opt.optionText}</span>
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                            <button
                                type="button"
                                style={styles.reorderBtn}
                                onClick={() => move(i, i - 1)}
                                disabled={i === 0}
                                aria-label={`Move "${opt.optionText}" up`}
                            >
                                <ChevronUp size={14} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                style={styles.reorderBtn}
                                onClick={() => move(i, i + 1)}
                                disabled={i === items.length - 1}
                                aria-label={`Move "${opt.optionText}" down`}
                            >
                                <ChevronDown size={14} aria-hidden="true" />
                            </button>
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/* ─── Match the following ──────────────────────────────── */
function MatchQuestion({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const leftItems = opts.filter((o) => o.matchPairKey);
    const rightItems = opts.filter((o) => o.matchPairVal);
    const pairs = ans?.matchPairs ?? {};

    const lefts = leftItems.length
        ? leftItems
        : opts.slice(0, Math.ceil(opts.length / 2));
    const rights = rightItems.length
        ? rightItems
        : opts.slice(Math.ceil(opts.length / 2));

    const rightOptions = [
        { value: '', label: '— Select match —' },
        ...rights.map((o) => ({
            value: String(o.uuid),
            label: o.matchPairVal || o.optionText,
        })),
    ];

    const colorsArr = [
        'var(--color-primary)',
        'var(--color-success)',
        'var(--color-warning)',
        'var(--color-danger)',
        'var(--color-info)',
        'var(--color-accent-yellow)',
    ];

    return (
        <div>
            <p
                style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 16,
                    fontStyle: 'italic',
                }}
            >
                Match each item on the left with the correct answer
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lefts.map((left, i) => {
                    const c = colorsArr[i % colorsArr.length];
                    const leftLabel = left.matchPairKey || left.optionText;
                    return (
                        <div
                            key={left.uuid}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div
                                style={{
                                    flex: '1 1 200px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '12px 16px',
                                    background: 'var(--color-bg-muted)',
                                    borderRadius: 10,
                                    border: '2px solid var(--color-border-soft)',
                                }}
                            >
                                <div
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: c,
                                        flexShrink: 0,
                                    }}
                                    aria-hidden="true"
                                />
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                    {leftLabel}
                                </span>
                            </div>
                            <div
                                aria-hidden="true"
                                style={{
                                    color: 'var(--color-text-muted)',
                                    fontWeight: 700,
                                    fontSize: 18,
                                }}
                            >
                                →
                            </div>
                            <div style={{ flex: '1 1 200px', position: 'relative' }}>
                                <select
                                    aria-label={`Match for "${leftLabel}"`}
                                    value={String(pairs[left.uuid] ?? '')}
                                    onChange={(e) => {
                                        const val = e.target.value || undefined;
                                        const newPairs = { ...pairs };
                                        if (val) newPairs[left.uuid] = val;
                                        else delete newPairs[left.uuid];
                                        setAns((cur) => ({ ...cur, matchPairs: newPairs }));
                                    }}
                                    style={{
                                        width: '100%',
                                        height: 44,
                                        borderRadius: 10,
                                        border: `2px solid ${pairs[left.uuid] ? c : 'var(--color-border-soft)'
                                            }`,
                                        padding: '0 36px 0 12px',
                                        fontSize: 14,
                                        outline: 'none',
                                        background: 'var(--color-bg-card)',
                                        appearance: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {rightOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none',
                                        color: 'var(--color-text-muted)',
                                    }}
                                >
                                    ▼
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Dispatcher ───────────────────────────────────────── */
/**
 * Picks the right question-type renderer based on `question.questionType`.
 * Single source of truth for the quiz-taking experience — also reusable
 * in other surfaces (e.g. attempt review, admin previews) by passing a
 * read-only `setAns` (no-op).
 */
export default function QuestionRenderer({ question, ans, setAns }) {
    if (!question) return null;
    const type = String(question.questionType ?? '');
    switch (type) {
        case 'MCQ_SINGLE':
            return <MCQSingle question={question} ans={ans} setAns={setAns} />;
        case 'MCQ_MULTI':
            return <MCQMulti question={question} ans={ans} setAns={setAns} />;
        case 'TRUE_FALSE':
            return <TrueFalse question={question} ans={ans} setAns={setAns} />;
        case 'SHORT_ANSWER':
        case 'FILL_IN_THE_BLANK':
            return <TextAnswer ans={ans} setAns={setAns} rows={3} />;
        case 'ESSAY':
            return <TextAnswer ans={ans} setAns={setAns} rows={8} essay />;
        case 'ORDERING':
            return <OrderingQuestion question={question} ans={ans} setAns={setAns} />;
        case 'MATCH_THE_FOLLOWING':
            return <MatchQuestion question={question} ans={ans} setAns={setAns} />;
        case 'CODE_SNIPPET':
            return <MCQSingle question={question} ans={ans} setAns={setAns} />;
        case 'IMAGE_BASED':
            return (
                <div>
                    {question.mediaUrl && (
                        <img
                            src={question.mediaUrl}
                            alt="Question"
                            style={{
                                maxWidth: '100%',
                                borderRadius: 12,
                                marginBottom: 16,
                                border: '1px solid var(--color-border-soft)',
                            }}
                        />
                    )}
                    <MCQSingle question={question} ans={ans} setAns={setAns} />
                </div>
            );
        default:
            return <TextAnswer ans={ans} setAns={setAns} rows={3} />;
    }
}

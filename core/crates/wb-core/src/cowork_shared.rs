// Cowork's pure rules: shapes, limits and prompts shared by the meeting and execution engines.
use std::collections::HashSet;
use std::sync::OnceLock;

use regex::Regex;
use serde_json::{json, Map, Value};

pub const COWORK_AGENTS: [&str; 3] = ["claude", "codex", "antigravity"];

pub const DEFAULT_MAX_PLANNING_CALLS: i64 = 6;
pub const DEFAULT_MAX_PLANNING_MINUTES: i64 = 20;
pub const DEFAULT_MAX_EXECUTION_MINUTES: i64 = 60;

fn safe_model() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    // Goes on a command line, and codex reads the effort as a TOML value: safe characters only
    R.get_or_init(|| Regex::new(r"^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,99}$").unwrap())
}

fn safe_effort() -> &'static Regex {
    static R: OnceLock<Regex> = OnceLock::new();
    R.get_or_init(|| Regex::new(r"^[a-z]{2,12}$").unwrap())
}

pub fn sanitize_model_choice(raw: Option<&Value>) -> Value {
    let s = |k: &str| raw.and_then(|r| r.get(k)).and_then(Value::as_str).unwrap_or("").trim().to_string();
    let (model, effort) = (s("model"), s("effort"));
    json!({ "model": if safe_model().is_match(&model) { model } else { String::new() }, "effort": if safe_effort().is_match(&effort) { effort } else { String::new() } })
}

pub fn sanitize_model_choices(raw: Option<&Value>) -> Value {
    let mut out = Map::new();
    if let Some(r) = raw.filter(|r| r.is_object()) {
        for a in COWORK_AGENTS {
            let c = sanitize_model_choice(r.get(a));
            if c["model"] != "" || c["effort"] != "" {
                out.insert(a.to_string(), c);
            }
        }
    }
    Value::Object(out)
}

pub fn is_agent(v: Option<&Value>) -> bool {
    v.and_then(Value::as_str).map(|s| COWORK_AGENTS.contains(&s)).unwrap_or(false)
}

pub fn clamp_int(v: Option<&Value>, lo: i64, hi: i64, dflt: i64) -> i64 {
    match v.and_then(Value::as_f64).filter(|f| f.is_finite()) {
        Some(f) => ((f + 0.5).floor() as i64).clamp(lo, hi),
        None => dflt,
    }
}

/// A user preference, but the shape still gets checked: a bad value falls back and cannot raise a limit absurdly
pub fn sanitize_cowork_settings(raw: Option<&Value>) -> Value {
    let empty = json!({});
    let r = raw.filter(|v| v.is_object()).unwrap_or(&empty);
    let mut seen = HashSet::new();
    let participants: Vec<Value> = r.get("participants").and_then(Value::as_array).into_iter().flatten().filter(|p| is_agent(Some(p)) && seen.insert(p.as_str().unwrap().to_string())).cloned().collect();
    let limits = r.get("limits").filter(|v| v.is_object()).unwrap_or(&empty);
    let mut seen = HashSet::new();
    let skills: Vec<&str> = r.get("skills").and_then(Value::as_array).into_iter().flatten().filter_map(Value::as_str).filter(|k| k.encode_utf16().count() < 400 && seen.insert(k.to_string())).take(50).collect();
    let agent_or_null = |k: &str| r.get(k).filter(|v| is_agent(Some(v))).cloned().unwrap_or(Value::Null);
    let flag = |k: &str, d: bool| r.get(k).and_then(Value::as_bool).unwrap_or(d);
    let root = r.get("worktreeRoot").and_then(Value::as_str).map(|s| crate::util::js_prefix(s.trim(), 500)).unwrap_or_default();
    json!({
        "chair": agent_or_null("chair"),
        "summarizer": agent_or_null("summarizer"),
        "summarizeEachRound": r.get("summarizeEachRound") == Some(&json!(true)),
        "participants": participants,
        "chairExecutes": flag("chairExecutes", true),
        "limits": {
            "maxPlanningCalls": clamp_int(limits.get("maxPlanningCalls"), 3, 30, DEFAULT_MAX_PLANNING_CALLS),
            "maxPlanningMinutes": clamp_int(limits.get("maxPlanningMinutes"), 1, 120, DEFAULT_MAX_PLANNING_MINUTES),
            "maxExecutionMinutes": clamp_int(limits.get("maxExecutionMinutes"), 1, 600, DEFAULT_MAX_EXECUTION_MINUTES),
        },
        "models": sanitize_model_choices(r.get("models")),
        "skills": skills,
        "projectInstructions": flag("projectInstructions", true),
        "execReview": flag("execReview", true),
        "worktreeRoot": root,
        "runawayStop": r.get("runawayStop") == Some(&json!(true)),
    })
}

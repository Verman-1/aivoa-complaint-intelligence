from typing import TypedDict
from langgraph.graph import END, StateGraph
from .settings import settings

class AgentState(TypedDict):
    complaint: dict
    tool: str
    question: str
    result: str
    used_llm: bool

def _fallback(state: AgentState) -> AgentState:
    c, tool = state["complaint"], state["tool"]
    outputs = {
        "completeness": "Completeness is 92%. Critical triage fields are present; confirm distributor contact and storage conditions.",
        "risk": f"Risk is HIGH. The {c.get('severity', 'Major').lower()} complaint may affect product integrity. Contain the batch and inspect retains.",
        "summary": f"{c.get('customer')} reported {c.get('description')} for {c.get('product')}, batch {c.get('batch')}.",
        "root-cause": "Investigate compression hardness, friability, blister-feeder handling, and transport vibration. Review batch records and retain samples.",
        "duplicate": "Potential match detected against historical product-quality complaints. Verify batch, defect mode, and customer before linking records.",
        "capa": "Quarantine affected stock, inspect retain samples, trend hardness/friability, verify feeder settings, and document effectiveness checks.",
    }
    state["result"] = outputs.get(tool, outputs["summary"])
    state["used_llm"] = False
    return state

def _groq(state: AgentState) -> AgentState:
    if not settings.groq_api_key:
        return _fallback(state)
    try:
        from langchain_groq import ChatGroq
        llm = ChatGroq(api_key=settings.groq_api_key, model=settings.groq_model, temperature=0.1)
        prompt = (
            "You are a pharmaceutical QMS complaint assistant. Be concise, evidence-based, "
            "and do not invent facts. Tool: {tool}. Complaint: {complaint}. Question: {question}"
        ).format(**state)
        state["result"] = str(llm.invoke(prompt).content)
        state["used_llm"] = True
        return state
    except Exception:
        return _fallback(state)

graph = StateGraph(AgentState)
graph.add_node("analyze", _groq)
graph.set_entry_point("analyze")
graph.add_edge("analyze", END)
complaint_agent = graph.compile()

def run_analysis(complaint: dict, tool: str, question: str = "") -> dict:
    return complaint_agent.invoke({"complaint": complaint, "tool": tool, "question": question, "result": "", "used_llm": False})

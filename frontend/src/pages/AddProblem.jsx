import { useNavigate } from "react-router-dom";
import ProblemForm from "../components/ProblemForm";
import { useAppData } from "../context/AppDataContext";

export default function AddProblem() {
  const navigate = useNavigate();
  const { addProblem } = useAppData();

  const handleSave = async (form) => {
    try {
      await addProblem(form);
      navigate("/dashboard");
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#F1F1F3]">Add Problem</h1>
      <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-4 md:p-6">
        <ProblemForm onSave={handleSave} onCancel={() => navigate("/dashboard")} />
      </div>
    </div>
  );
}

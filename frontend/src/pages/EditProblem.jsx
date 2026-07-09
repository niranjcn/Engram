import { useNavigate, useParams } from "react-router-dom";
import ProblemForm from "../components/ProblemForm";
import { useAppData } from "../context/AppDataContext";

export default function EditProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { problems, updateProblem } = useAppData();
  const problem = problems.find(p => p.id === id);

  if (!problem) return <div className="text-[#5D616C] text-center py-12">Problem not found</div>;

  const handleSave = async (form) => {
    try {
      await updateProblem(id, form);
      navigate("/problems");
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#F1F1F3]">Edit Problem</h1>
      <div className="rounded-xl border border-[#23262E] bg-[#16181E] p-4 md:p-6">
        <ProblemForm initial={problem} onSave={handleSave} onCancel={() => navigate("/problems")} />
      </div>
    </div>
  );
}

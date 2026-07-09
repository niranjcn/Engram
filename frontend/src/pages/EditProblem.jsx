import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/Card";
import ProblemForm from "../components/ProblemForm";
import { useAppData } from "../context/AppDataContext";

export default function EditProblem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { problems, updateProblem } = useAppData();
  const problem = problems.find(p => p.id === id);

  if (!problem) return <div className="text-gray-400 text-center py-12 font-mono">Problem not found</div>;

  const handleSave = async (form) => {
    try {
      await updateProblem(id, form);
      navigate("/problems");
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-mono font-bold text-white">Edit Problem</h1>
      <Card className="p-5"><ProblemForm initial={problem} onSave={handleSave} onCancel={() => navigate("/problems")} /></Card>
    </div>
  );
}

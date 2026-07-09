import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
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
    <div className="space-y-4">
      <h1 className="text-xl font-mono font-bold text-white">Add Problem</h1>
      <Card className="p-5"><ProblemForm onSave={handleSave} onCancel={() => navigate("/dashboard")} /></Card>
    </div>
  );
}

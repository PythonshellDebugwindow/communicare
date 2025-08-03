import { useEffect, useRef, useState } from 'react';

import ErrorMessage from '../components/ErrorMessage';

import { getBackend, postBackend, useSetPageTitle } from '../utils';
import { useSearchParams } from 'react-router';

interface IPoint {
  x: number;
  y: number;
}

export default function BodyPage() {
  const [searchParams] = useSearchParams();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseCanvas = useRef<HTMLCanvasElement>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");

  const [painAreas, setPainAreas] = useState<IPoint[]>([]);
  const bodyImage = useRef(new Image());
  const [bodyImageHasLoaded, setBodyImageHasLoaded] = useState(false);
  const undoImage = useRef(new Image());
  const [undoImageHasLoaded, setUndoImageHasLoaded] = useState(false);

  const symptomNames = ["cough", "sneeze", "nausea", "runny nose", "fatigue"];
  const [symptoms, setSymptoms] = useState(symptomNames.map(name => ({
    name, selected: false
  })));

  const [additional, setAdditional] = useState("");

  const [patientDoctor, setPatientDoctor] = useState("");

  const shareKey = +(searchParams.get('share') ?? "");

  useSetPageTitle("Patient");

  useEffect(() => {
    if(!shareKey || isNaN(shareKey)) {
      setMessage("No share key provided. Ask your doctor for the correct URL.");
      return;
    }

    if(!canvasRef.current || !baseCanvas.current) {
      return;
    }
    
    const c = canvasRef.current.getContext('2d');
    if(!c) {
      throw new Error("Your browser does not support the canvas element.");
    }

    setTimeout(async () => {
      const result = await getBackend('patient-doctor/' + shareKey);
      if(!result.ok) {
        setMessage(result.body.message || `Error ${result.status}.`);
        return;
      }
      setPatientDoctor(result.body.name);
      
      bodyImage.current.onload = () => {
        if(canvasRef.current) {
          canvasRef.current.width = 200;
          canvasRef.current.height = 500;
        }
        c.strokeStyle = "red";
        c.fillStyle = "red";
        drawBodyWithPain(c, painAreas);
        setBodyImageHasLoaded(true);
        if(baseCanvas.current) {
          baseCanvas.current.width = 200;
          baseCanvas.current.height = 500;
          const bc = baseCanvas.current.getContext('2d');
          if(!bc) {
            throw new Error("Your browser does not support the canvas element.");
          }
          drawBodyWithPain(bc, []);
        }
      };
      bodyImage.current.src = "/body2.png";

      undoImage.current = new Image();
      undoImage.current.onload = () => {
        setUndoImageHasLoaded(true);
        if(baseCanvas.current) {
          const bc = baseCanvas.current.getContext('2d');
          if(!bc) {
            throw new Error("Your browser does not support the canvas element.");
          }
          bc.drawImage(undoImage.current, 0, 0, 40, 40);
        }
      };
      undoImage.current.src = "/undo.png";
    });
  }, [canvasRef, baseCanvas]);

  function drawBodyWithPain(c: CanvasRenderingContext2D, points: IPoint[], subOneFromUndoCount: boolean = false) {
    if(!canvasRef.current) {
      return;
    }

    c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    c.drawImage(bodyImage.current, -150, 0, 500, 500);
    if(points.length - +subOneFromUndoCount > 0 && undoImageHasLoaded) {
      c.drawImage(undoImage.current, 0, 0, 40, 40);
    }
    for(const point of points) {
      c.beginPath();
      c.arc(point.x, point.y, 7, 0, 2 * Math.PI);
      c.stroke();
      c.beginPath();
      c.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      c.fill();
    }
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if(!canvasRef.current || !baseCanvas.current || !bodyImageHasLoaded ||
        !undoImageHasLoaded || isPosting) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const c = canvasRef.current.getContext('2d');
    const bc = baseCanvas.current.getContext('2d');
    if(!c || !bc) {
      throw new Error("Your browser does not support the canvas element.");
    }

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const data = bc.getImageData(clickX, clickY, 1, 1);
    if(data.data[3] >= 200) {
      const undo = clickX < 40 && clickY < 40;
      if(undo && painAreas.length === 0) {
        return;
      }
      const newPainAreas = (
        undo ? painAreas.slice(0, painAreas.length - 1) : [...painAreas, { x: clickX, y: clickY }]
      );
      setPainAreas(newPainAreas);
      setTimeout(() => drawBodyWithPain(c, newPainAreas));
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if(!canvasRef.current || !baseCanvas.current || !bodyImageHasLoaded ||
        !undoImageHasLoaded || isPosting) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const c = canvasRef.current.getContext('2d');
    const bc = baseCanvas.current.getContext('2d');
    if(!c || !bc) {
      throw new Error("Your browser does not support the canvas element.");
    }

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const data = bc.getImageData(clickX, clickY, 1, 1);
    canvasRef.current.style.cursor = "default";
    if(data.data[3] >= 200) {
      const undo = clickX < 40 && clickY < 40;
      if(!undo || undo && painAreas.length > 0) {
        canvasRef.current.style.cursor = "pointer";
      }
      if(!undo) {
        drawBodyWithPain(c, [...painAreas, { x: clickX, y: clickY }], true);
      }
      return;
    }
    drawBodyWithPain(c, painAreas);
  }

  async function postData() {
    if(!canvasRef.current) {
      return;
    }

    const c = canvasRef.current.getContext('2d');
    if(!c) {
      throw new Error("Your browser does not support the canvas element.");
    }

    setIsPosting(true);

    c.clearRect(0, 0, 40, 40);

    const pngData = canvasRef.current.toDataURL('image/png');
    const activeSymptoms = symptoms.flatMap(symptom => symptom.selected ? [symptom.name] : []);
    const requestBody = { image: pngData, symptoms: activeSymptoms, additional, shareKey };
    const result = await postBackend('body', requestBody);
    if(!result.ok) {
      setMessage(result.body.message);
    }
    console.log(result.body.message)
    setIsPosting(false);
  }
  
  return (
    <section>
      <h2>Patient Page</h2>
      {!patientDoctor && !message && <p>Working...</p>}
      {patientDoctor && (
        <p style={{ marginLeft: "40px", marginRight: "40px" }}>
          Select the areas on the body below which are causing you pain, and select
          appropriate symptoms. You can also leave other comments if you wish. The
          results will be analysed and reviewed by Dr. {patientDoctor}.
        </p>
      )}
      <ErrorMessage message={message} />
      {!!shareKey && patientDoctor && (
        <button
          type="button"
          onClick={postData}
          disabled={isPosting}
          style={{ marginBottom: "10px" }}
        >
          {isPosting ? "Working..." : "↑ Upload"}
        </button>
      )}
      <div
        style={{ display: (shareKey && patientDoctor) ? "flex" : "none", justifyContent: "center" }}
      >
        <canvas
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          ref={canvasRef}
        />
        <canvas
          ref={baseCanvas}
          style={{ display: "none" }}
        />
        <div>
          <ul style={{ listStyle: "none", textAlign: "left" }}>
            {symptoms.map((symptom, i) => (
              <li key={symptom.name}>
                <label style={{ cursor: "pointer" }} onClick={() => console.log(symptom)}>
                  <input
                    type="checkbox"
                    checked={symptom.selected}
                    onChange={e => {
                      const newSymptom = { name: symptom.name, selected: e.target.checked };
                      setSymptoms(symptoms.with(i, newSymptom));
                    }}
                  />
                  {symptom.name}
                </label>
              </li>
            ))}
          </ul>
          <div style={{ textAlign: "left", marginLeft: "42px" }}>
            <h3 style={{ fontSize: "1.5em", marginBottom: "5px" }}>
              <label htmlFor="additional">Additional notes:</label>
            </h3>
            <textarea
              id="additional"
              value={additional}
              onChange={e => setAdditional(e.target.value)}
              style={{ width: "150%", height: "8em" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

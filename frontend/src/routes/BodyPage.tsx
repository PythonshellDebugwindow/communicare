import { useEffect, useRef, useState } from 'react';

import ErrorMessage from '../components/ErrorMessage';

import { postBackend, useSetPageTitle } from '../utils';

interface IPoint {
  x: number;
  y: number;
}

export default function BodyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");

  const [painAreas, setPainAreas] = useState<IPoint[]>([]);
  const bodyImage = useRef(new Image());
  const [bodyImageHasLoaded, setBodyImageHasLoaded] = useState(false);
  const undoImage = useRef(new Image());
  const [undoImageHasLoaded, setUndoImageHasLoaded] = useState(false);
  const baseCanvas = useRef<HTMLCanvasElement>(null);

  const symptomNames = ["cough", "sneeze", "nausea", "runny nose", "fatigue"];
  const [symptoms, setSymptoms] = useState(symptomNames.map(name => ({
    name, selected: false
  })));

  useSetPageTitle("Patient");

  useEffect(() => {
    if(!canvasRef.current || !baseCanvas.current) {
      return;
    }
    
    const c = canvasRef.current.getContext('2d');
    if(!c) {
      throw new Error("Your browser does not support the canvas element.");
    }
    
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
    bodyImage.current.src = "/body.png";

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

    const pngData = canvasRef.current.toDataURL('image/png');
    const activeSymptoms = symptoms.flatMap(symptom => symptom.selected ? [symptom.name] : []);
    const result = await postBackend('body', { image: pngData, symptoms: activeSymptoms });
    if(!result.ok) {
      setMessage(result.body.message);
    }
    console.log(result.body.message)
    setIsPosting(false);
  }
  
  return (
    <section>
      <h2>Patient Page</h2>
      <ErrorMessage message={message} />
      <button
        type="button"
        onClick={postData}
        disabled={isPosting}
      >
        {isPosting ? "Working..." : "↑ Upload"}
      </button>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <canvas
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          ref={canvasRef}
        />
        <canvas
          ref={baseCanvas}
          style={{ display: "none" }}
        />
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
      </div>
      {/* <img
        src="/body.png"
        style={{ height: "500px" }}
        onClick={handleClick}
        // ref={bodyImgRef}
      /> */}
    </section>
  );
}

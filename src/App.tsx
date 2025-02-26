import "./App.css";
import { LeftSidebar, Navbar, RightSidebar } from "./components/index";
import Live from "./components/Live";
import { useMutation, useRedo, useStorage, useUndo } from "../liveblocks.config";
import { useRef, useEffect, useState } from "react";
import { FabricObject, Canvas } from "fabric";
import {
  handleCanvasMouseDown,
  handleCanvaseMouseMove,
  handleCanvasMouseUp,
  handleCanvasObjectMoving,
  handleResize,
  handlePathCreated,
  renderCanvas,
  handleCanvasObjectModified,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  initializeFabric,
  handleCanvasZoom,
} from "./lib/canvas";
import { handleDelete, handleKeyDown } from "./lib/key-events";
import { defaultNavElement } from "./constants";
import { ActiveElement, Attributes } from "./types/type";
import { handleImageUpload } from "./lib/shapes";

function App() {
  const undo = useUndo();
  const redo = useRedo();

  const canvasObjects = useStorage((root) => root.canvasObjects);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<FabricObject | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeObjectRef = useRef<FabricObject | null>(null);
  const isEditingRef = useRef(false);

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
  });

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      case "reset":
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement);
        break;

      case "delete":
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
        break;

      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        break;

      case "comments":
        break;

      default:
        selectedShapeRef.current = elem?.value as string;
        break;
    }
  };

  const handleActiveShapeSelection = (object: any) => {
    if (fabricRef.current) {
      const shape = fabricRef.current.getObjects().find((obj: FabricObject & { objectId?: string }) => obj.objectId === object[1].objectId);

      if (shape) {
        fabricRef.current.setActiveObject(shape);
        fabricRef.current.renderAll();
      }
    }
  };

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;
    const { objectId } = object;
    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.set(objectId, shapeData);
  }, []);

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");
    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }
    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, shapeId) => {
    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.delete(shapeId);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = initializeFabric({
      canvasRef,
      fabricRef,
    });

    // 🎯 Event handlers
    const handleMouseDown = (options: any) => handleCanvasMouseDown({ options, canvas, isDrawing, shapeRef, selectedShapeRef });
    const handleMouseMove = (options: any) => handleCanvaseMouseMove({ options, canvas, isDrawing, selectedShapeRef, shapeRef, syncShapeInStorage });
    const handleMouseUp = () => handleCanvasMouseUp({ canvas, isDrawing, shapeRef, activeObjectRef, selectedShapeRef, syncShapeInStorage, setActiveElement });
    const hanlePathCreatedEvent = (options: any) => handlePathCreated({ options, syncShapeInStorage });
    const handleObjectModifiedEvent = (options: any) => handleCanvasObjectModified({ options, syncShapeInStorage });
    const handleObjectMovingEvent = (options: any) => handleCanvasObjectMoving({ options });
    const handleObjectScalingEvent = (options: any) => handleCanvasObjectScaling({ options, setElementAttributes });
    const handleSelectionCreatedEvent = (options: any) => handleCanvasSelectionCreated({ options, isEditingRef, setElementAttributes });
    const handleWheelEvent = (options: any) => handleCanvasZoom({ options, canvas });
    const handleResizeEvent = () => handleResize({ canvas: fabricRef.current });
    const handleKeyDownEvent = (e: any) => handleKeyDown({ e, canvas: fabricRef.current, undo, redo, syncShapeInStorage, deleteShapeFromStorage });

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    canvas.on("path:created", hanlePathCreatedEvent);
    canvas.on("object:modified", handleObjectModifiedEvent);
    canvas?.on("object:moving", handleObjectMovingEvent);
    canvas.on("object:scaling", handleObjectScalingEvent);
    canvas.on("mouse:wheel", handleWheelEvent);
    canvas.on("selection:created", handleSelectionCreatedEvent);
    window.addEventListener("resize", handleResizeEvent);
    window.addEventListener("keydown", handleKeyDownEvent);

    // 🎯 Cleanup
    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      canvas.off("path:created", hanlePathCreatedEvent);
      canvas.off("object:modified", handleObjectModifiedEvent);
      canvas.off("object:moving", handleObjectMovingEvent);
      canvas.off("object:scaling", handleObjectScalingEvent);
      canvas.off("selection:created", handleSelectionCreatedEvent);
      window.removeEventListener("resize", handleResizeEvent);
      window.removeEventListener("keydown", handleKeyDownEvent);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

  // console.log(activeObjectRef.current);

  return (
    <main className='h-screen overflow-hidden'>
      <Navbar
        activeElement={activeElement}
        imageInputRef={imageInputRef}
        handleActiveElement={handleActiveElement}
        handleImageUpload={(e: any) => {
          e.stopPropagation();
          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
      />
      <section className='flex h-full flex-row text-white'>
        <LeftSidebar allShapes={Array.from(canvasObjects)} handleActiveShapeSelection={handleActiveShapeSelection} />
        <Live canvasRef={canvasRef} />
        <RightSidebar
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
    </main>
  );
}

export default App;

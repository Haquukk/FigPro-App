import "./App.css";
import {
  LeftSidebar,
  Navbar,
  RightSidebar,
} from "./components/index";
import Live from "./components/Live";
import {
  useMutation,
  useRedo,
  useStorage,
  useUndo,
} from "../liveblocks.config"
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
} from "./lib/canvas";
import {
  handleDelete,
  handleKeyDown,
} from "./lib/key-events";
import { defaultNavElement } from "./constants";
import { ActiveElement, Attributes } from "./types/type";
import { handleImageUpload } from "./lib/shapes";

function App() {
  const undo = useUndo();
  const redo = useRedo();

  const canvasObjects = useStorage(
    (root) => root.canvasObjects
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<FabricObject | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeObjectRef = useRef<FabricObject | null>(null);
  const isEditingRef = useRef(false);

  const [activeElement, setActiveElement] =
    useState<ActiveElement>({
      name: "",
      value: "",
      icon: "",
    });

  const [elementAttributes, setElementAttributes] =
    useState<Attributes>({
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
        handleDelete(
          fabricRef.current as any,
          deleteShapeFromStorage
        );
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

  const syncShapeInStorage = useMutation(
    ({ storage }, object) => {
      if (!object) return;
      const { objectId } = object;
      const shapeData = object.toJSON();
      shapeData.objectId = objectId;

      const canvasObjects = storage.get("canvasObjects");
      canvasObjects.set(objectId, shapeData);
    },
    []
  );

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");
    if (!canvasObjects || canvasObjects.size === 0)
      return true;

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }
    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(
    ({ storage }, shapeId) => {
      const canvasObjects = storage.get("canvasObjects");
      canvasObjects.delete(shapeId);
    },
    []
  );

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = initializeFabric({
        canvasRef,
        fabricRef,
      });

      canvas.on("mouse:down", (options) => {
        handleCanvasMouseDown({
          options,
          canvas,
          isDrawing,
          shapeRef,
          selectedShapeRef,
        });
      });

      canvas.on("mouse:move", (options) => {
        handleCanvaseMouseMove({
          options,
          canvas,
          isDrawing,
          selectedShapeRef,
          shapeRef,
          syncShapeInStorage,
        });
      });

      canvas.on("mouse:up", () => {
        handleCanvasMouseUp({
          canvas,
          isDrawing,
          shapeRef,
          activeObjectRef,
          selectedShapeRef,
          syncShapeInStorage,
          setActiveElement,
        });
      });

      canvas.on("path:created", (options) => {
        handlePathCreated({
          options,
          syncShapeInStorage,
        });
      });

      canvas.on("object:modified", (options) => {
        handleCanvasObjectModified({
          options,
          syncShapeInStorage,
        });
      });

      canvas?.on("object:moving", (options) => {
        handleCanvasObjectMoving({
          options,
        });
      });

      canvas.on("object:scaling", (options) => {
        handleCanvasObjectScaling({
          options,
          setElementAttributes,
        });
      });

      canvas.on("selection:created", (options) => {
        handleCanvasSelectionCreated({
          options,
          isEditingRef,
          setElementAttributes,
        });
      });

      window.addEventListener("resize", () => {
        handleResize({ canvas: fabricRef.current });
      });

      window.addEventListener("keydown", (e) => {
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage,
        });
      });

      return () => {
        window.removeEventListener("resize", () => {
          handleResize({ canvas: null });
        });
        window.removeEventListener("keydown", (e) => {
          handleKeyDown({
            e,
            canvas: fabricRef.current,
            undo,
            redo,
            syncShapeInStorage,
            deleteShapeFromStorage,
          });
        });
        canvas.dispose();
      };
    } else {
      return () => {
        console.log("canvasRef.current is null");
      };
    }
  }, [canvasRef]);

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

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
        <LeftSidebar
          allShapes={Array.from(canvasObjects)}
        />
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

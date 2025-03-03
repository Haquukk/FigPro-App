import * as fabric from "fabric";
import { v4 as uuid4 } from "uuid";

import {
  CanvasMouseDown,
  CanvasMouseMove,
  CanvasMouseUp,
  CanvasObjectModified,
  CanvasObjectScaling,
  CanvasPathCreated,
  CanvasSelectionCreated,
  RenderCanvas,
} from "@/types/type";
import { defaultNavElement } from "@/constants";
import { createSpecificShape } from "./shapes";
import { FabricObject } from "fabric";

// initialize fabric canvas
export const initializeFabric = ({
  fabricRef,
  canvasRef,
}: {
  fabricRef: React.RefObject<fabric.Canvas | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) => {
  const canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
  
  // create fabric canvas
  const canvas = new fabric.Canvas(canvasRef.current || canvasElement, {
    width: canvasElement?.clientWidth,
    height: canvasElement?.clientHeight,
  });
  
  // set canvas reference to fabricRef so we can use it later anywhere outside canvas listener
  canvas.renderAll();
  fabricRef.current = canvas;
  
  return canvas;
};

// instantiate creation of custom fabric object/shape and add it to canvas
export const handleCanvasMouseDown = ({
  options,
  canvas,
  selectedShapeRef,
  isDrawing,
  shapeRef,
}: CanvasMouseDown) => {

  const pointer = canvas.getViewportPoint(options.e);
  const target = canvas.findTarget(options.e);

  canvas.isDrawingMode = false;
  if (selectedShapeRef.current === "freeform") {
    isDrawing.current = true;
    canvas.isDrawingMode = true;
    if(!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 5;
    }
    return;
  }

  if (target && (target.type === selectedShapeRef.current || target.type === "activeSelection")) {
    isDrawing.current = false;
    canvas.setActiveObject(target);
    target.setCoords();
  } else {
    isDrawing.current = true;
    shapeRef.current = createSpecificShape(
      selectedShapeRef.current,
      pointer as any
    );
    if (shapeRef.current) {
      canvas.add(shapeRef.current);
    }
  }

};

// handle mouse move event on canvas to draw shapes with different dimensions
export const handleCanvaseMouseMove = ({
  options,
  canvas,
  isDrawing,
  selectedShapeRef,
  shapeRef,
  syncShapeInStorage,
}: CanvasMouseMove) => {
  // if selected shape is freeform, return
  if (!isDrawing.current) return;
  if (selectedShapeRef.current === "freeform") return;

  canvas.isDrawingMode = false;

  // get pointer coordinates
  const pointer = canvas.getViewportPoint(options.e);

  // depending on the selected shape, set the dimensions of the shape stored in shapeRef in previous step of handelCanvasMouseDown
  // calculate shape dimensions based on pointer coordinates
  switch (selectedShapeRef?.current) {
    case "rectangle":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });
      break;

    case "circle":
      shapeRef.current.set({
        radius: Math.abs(pointer.x - (shapeRef.current?.left || 0)) / 2,
      });
      break;

    case "triangle":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });
      break;

    case "line":
      shapeRef.current?.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      break;

    case "image":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });
      break;

    default:
      break;
  }

  // render objects on canvas
  // renderAll: http://fabricjs.com/docs/fabric.Canvas.html#renderAll
  canvas.renderAll();

  // sync shape in storage
  if (shapeRef.current?.objectId) {
    syncShapeInStorage(shapeRef.current);
  }
};

// handle mouse up event on canvas to stop drawing shapes
export const handleCanvasMouseUp = ({
  canvas,
  isDrawing,
  shapeRef,
  activeObjectRef,
  selectedShapeRef,
  syncShapeInStorage,
  setActiveElement,
}: CanvasMouseUp) => {
  isDrawing.current = false;
  if (selectedShapeRef.current === "freeform") return;

  // sync shape in storage as drawing is stopped
  syncShapeInStorage(shapeRef.current);

  // set everything to null
  shapeRef.current = null;
  activeObjectRef.current = null;
  selectedShapeRef.current = null;

  // if canvas is not in drawing mode, set active element to default nav element after 700ms
  if (!canvas.isDrawingMode) {
    setTimeout(() => {
      setActiveElement(defaultNavElement);
    }, 700);
  }
};

// update shape in storage when object is modified
export const handleCanvasObjectModified = ({
  options,
  syncShapeInStorage,
}: CanvasObjectModified) => {
  const target = options.target;
  if (!target) return;

  if (target?.type === "activeselection" ) {
  } else {
    syncShapeInStorage(target);
  }
};

// update shape in storage when path is created when in freeform mode
export const  handlePathCreated = ({
  options,
  syncShapeInStorage,
}: CanvasPathCreated) => {
  // get path object
  const path = options.path;
  if (!path) return;

  // set unique id to path object
  path.set({
    objectId: uuid4(),
  });

  // sync shape in storage
  syncShapeInStorage(path);
};

// check how object is moving on canvas and restrict it to canvas boundaries
export const handleCanvasObjectMoving = ({
  options,
}: {
  options: fabric.TEvent;
}) => {
  // get target object which is moving
  const target = options.e.target as fabric.Object | null;
  if (!target) return;

  // target.canvas is the canvas on which the object is moving
  const canvas = target.canvas 
  if (!canvas) return;

  // set coordinates of target object
  target.setCoords();

  // restrict object to canvas boundaries (horizontal)
  if (target && target.left) {
    target.left = Math.max(
      0,
      Math.min(
        target.left,
        (canvas.width || 0) - (target.getScaledWidth() || target.width || 0)
      )
    );
  }

  // restrict object to canvas boundaries (vertical)
  if (target && target.top) {
    target.top = Math.max(
      0,
      Math.min(
        target.top,
        (canvas.height || 0) - (target.getScaledHeight() || target.height || 0)
      )
    );
  }
};

// set element attributes when element is selected
export const handleCanvasSelectionCreated = ({
  options,
  isEditingRef,
  setElementAttributes,
}: CanvasSelectionCreated) => {
  // if user is editing manually, return
  if (isEditingRef.current) return;

  // if no element is selected, return
  if (!options?.selected) return;

  // get the selected element
  const selectedElement = options?.selected[0] as fabric.Object;

  // if only one element is selected, set element attributes
  if (selectedElement && options.selected.length === 1) {
    // calculate scaled dimensions of the object
    const scaledWidth = selectedElement?.scaleX
    ? selectedElement?.width * selectedElement?.scaleX
    : selectedElement?.width;
    
    const scaledHeight = selectedElement?.scaleY
    ? selectedElement?.height * selectedElement?.scaleY
    : selectedElement?.height;

    setElementAttributes({
      width: scaledWidth?.toFixed(0).toString() || "",
      height: scaledHeight?.toFixed(0).toString() || "",
      fill: selectedElement?.fill?.toString() || "",
      stroke: selectedElement?.stroke?.toString() || "",
      // @ts-ignore
      fontSize: selectedElement?.fontSize || "",
      // @ts-ignore
      fontFamily: selectedElement?.fontFamily || "",
      // @ts-ignore
      fontWeight: selectedElement?.fontWeight || "",
    });

  }
};

// update element attributes when element is scaled
export const handleCanvasObjectScaling = ({
  options,
  setElementAttributes,
}: CanvasObjectScaling) => {
  const selectedElement = options.target;

  // calculate scaled dimensions of the object
  const scaledWidth = selectedElement?.scaleX
    ? selectedElement?.width! * selectedElement?.scaleX
    : selectedElement?.width;

  const scaledHeight = selectedElement?.scaleY
    ? selectedElement?.height! * selectedElement?.scaleY
    : selectedElement?.height;

  setElementAttributes((prev) => ({
    ...prev,
    width: scaledWidth?.toFixed(0).toString() || "",
    height: scaledHeight?.toFixed(0).toString() || "",
  }));
};


// Render canvas objects coming from storage on canvas
export const renderCanvas = async ({
  fabricRef,
  canvasObjects,
  activeObjectRef,
}: RenderCanvas) => {
  try {
    // Pastikan fabricRef dan canvasObjects valid
    if (!fabricRef.current || !canvasObjects) {
      console.error("fabricRef or canvasObjects is not valid");
      return;
    }
    // Clear canvas
    const cachedActiveObject = fabricRef.current.getActiveObject() as (fabric.Object & { objectId?: string })
    fabricRef.current.clear();

    // console.log(cachedActiveObject)

    // Render all objects on canvas
    Array.from(canvasObjects, async ([objectId, objectData]) => {
      try {
        // Pastikan objectData valid
        if (!objectData) {
          console.error(`Invalid objectData for objectId: ${objectId}`);
          return;
        }
        
        // Gunakan API terbaru dengan options
        const enlivenedObjects = await fabric.util.enlivenObjects([objectData])
        
        enlivenedObjects.forEach((enlivenedObj) => {
          if (!(enlivenedObj instanceof FabricObject)) {
            console.error("Invalid enlivened object type:", enlivenedObj);
            return;
          }

          // Jika objek aktif, set sebagai objek aktif 
          if (activeObjectRef.current?.objectId === objectId 
            || cachedActiveObject?.objectId === objectId) {
            fabricRef.current?.setActiveObject(enlivenedObj);
          }

          // Tambahkan objek ke canvas
          fabricRef.current?.add(enlivenedObj);
        });

      } catch (error) {
        console.error("Error enlivening object with ID ${objectId}:", error);
      }
    });

    // Render ulang canvas
    fabricRef.current.renderAll();
  } catch (error) {
    console.error("Error in renderCanvas function:", error);
  }
};


// resize canvas dimensions on window resize
export const handleResize = ({ canvas }: { canvas: fabric.Canvas | null }) => {
  const canvasElement = document.getElementById("canvas");
  if (!canvasElement) return;

  if (!canvas) return;

  canvas.setDimensions({
    width: canvasElement.clientWidth,
    height: canvasElement.clientHeight,
  });
};

// zoom canvas on mouse scroll
export const handleCanvasZoom = ({
  options,
  canvas,
}: {
  options: fabric.TEvent & { e: WheelEvent };
  canvas: fabric.Canvas;
}) => {
  const delta = options.e?.deltaY;
  let zoom = canvas.getZoom();

  // allow zooming to min 20% and max 100%
  const minZoom = 0.2;
  const maxZoom = 1;
  const zoomStep = 0.001;

  // calculate zoom based on mouse scroll wheel with min and max zoom
  zoom = Math.min(Math.max(minZoom, zoom + delta * zoomStep), maxZoom);

  // set zoom to canvas
  // zoomToPoint: http://fabricjs.com/docs/fabric.Canvas.html#zoomToPoint
  canvas.zoomToPoint({ x: options.e.offsetX, y: options.e.offsetY } as fabric.Point, zoom);

  options.e.preventDefault();
  options.e.stopPropagation();
};
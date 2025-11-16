// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod drawing_engine;
mod mouse_control;
mod image_processing;

use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
struct CanvasRegion {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct DrawingParams {
    method: String,
    speed: u32,
    canvas: CanvasRegion,
}

// Command to start drawing
#[tauri::command]
async fn start_drawing(
    method: String,
    speed: u32,
    canvas: CanvasRegion,
) -> Result<String, String> {
    println!("Starting drawing with method: {}, speed: {}x", method, speed);
    println!("Canvas region: ({}, {}) - {}x{}", canvas.x, canvas.y, canvas.width, canvas.height);
    
    // TODO: Implement actual drawing logic
    // This is a placeholder that returns immediately
    
    Ok("Drawing started successfully".to_string())
}

// Command to select canvas region
#[tauri::command]
async fn select_canvas_region() -> Result<CanvasRegion, String> {
    println!("Selecting canvas region...");
    
    // TODO: Implement screenshot capture and region selection
    // For now, return a dummy region
    
    Ok(CanvasRegion {
        x: 100,
        y: 100,
        width: 800,
        height: 600,
    })
}

// Command to stop drawing
#[tauri::command]
fn stop_drawing() -> Result<String, String> {
    println!("Stopping drawing...");
    // TODO: Implement stop logic
    Ok("Drawing stopped".to_string())
}

// Command to pause drawing
#[tauri::command]
fn pause_drawing() -> Result<String, String> {
    println!("Pausing drawing...");
    // TODO: Implement pause logic
    Ok("Drawing paused".to_string())
}

// Command to resume drawing
#[tauri::command]
fn resume_drawing() -> Result<String, String> {
    println!("Resuming drawing...");
    // TODO: Implement resume logic
    Ok("Drawing resumed".to_string())
}

// Command to process image
#[tauri::command]
async fn process_image(image_path: String) -> Result<String, String> {
    println!("Processing image: {}", image_path);
    
    // TODO: Implement image processing
    // - Load image
    // - Convert to appropriate format
    // - Generate drawing instructions based on method
    
    Ok("Image processed successfully".to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_drawing,
            select_canvas_region,
            stop_drawing,
            pause_drawing,
            resume_drawing,
            process_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
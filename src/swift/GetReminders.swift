import Foundation
import EventKit

// Main class to handle reminders operations
class RemindersManager {
    private let eventStore = EKEventStore()
    
    
    // Request access to reminders
    func requestAccess(completion: @escaping (Bool, Error?) -> Void) {
        if #available(macOS 14.0, *) {
            // Use the new API for macOS 14.0 and later
            eventStore.requestFullAccessToReminders { granted, error in
                completion(granted, error)
            }
        } else if #available(macOS 10.15, *) {
            // Use the older API for macOS 10.15 to 13.x
            eventStore.requestAccess(to: .reminder) { granted, error in
                completion(granted, error)
            }
        } else {
            // For older macOS versions
            eventStore.requestAccess(to: .reminder, completion: completion)
        }
    }
    
    // Get all reminder lists
    func getAllReminderLists() -> [EKCalendar] {
        return eventStore.calendars(for: .reminder)
    }
    
    // Get all reminders from a specific list
    func getRemindersFromList(calendar: EKCalendar, showCompleted: Bool = false, completion: @escaping ([EKReminder]?, Error?) -> Void) {
        let predicate = eventStore.predicateForReminders(in: [calendar])
        
        eventStore.fetchReminders(matching: predicate) { reminders in
            if let reminders = reminders {
                let filteredReminders = showCompleted ? reminders : reminders.filter { !$0.isCompleted }
                completion(filteredReminders, nil)
            } else {
                completion(nil, nil)
            }
        }
    }
    
    // Get all reminders from all lists
    func getAllReminders(showCompleted: Bool = false, completion: @escaping ([EKReminder]?, Error?) -> Void) {
        let calendars = getAllReminderLists()
        let predicate = eventStore.predicateForReminders(in: calendars)
        
        eventStore.fetchReminders(matching: predicate) { reminders in
            if let reminders = reminders {
                let filteredReminders = showCompleted ? reminders : reminders.filter { !$0.isCompleted }
                completion(filteredReminders, nil)
            } else {
                completion(nil, nil)
            }
        }
    }
    
    
    
    
    // Print reminder details
    func printReminderDetails(reminder: EKReminder) {
        print("Title: \(reminder.title ?? "No Title")")
        
        if let dueDateComponents = reminder.dueDateComponents {
            // Check if time components are set to determine if this is date-only or datetime
            let hasTimeComponents = dueDateComponents.hour != nil || dueDateComponents.minute != nil || dueDateComponents.second != nil
            
            if let dueDate = dueDateComponents.date {
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                
                if hasTimeComponents {
                    // Has time components - format with time
                    formatter.timeStyle = .short
                } else {
                    // Date-only - no time
                    formatter.timeStyle = .none
                }
                
                print("Due Date: \(formatter.string(from: dueDate))")
            }
        }
        
        if let notes = reminder.notes, !notes.isEmpty {
            print("Notes: \(notes)")
        }
        
        
        if let url = reminder.url {
            print("URL: \(url.absoluteString)")
        }
        
        if let calendar = reminder.calendar {
            print("List: \(calendar.title)")
        }
        
        print("Status: \(reminder.isCompleted ? "Completed" : "Not Completed")")
        
        print("-------------------")
    }
}

// Main execution
let manager = RemindersManager()

// Parse command line arguments
let args = CommandLine.arguments
let showCompleted = args.contains("--show-completed")
let checkPermissions = args.contains("--check-permissions")
let listName = args.first(where: { $0.hasPrefix("--list=") })?.replacingOccurrences(of: "--list=", with: "")

// Create a dispatch group to wait for async operations
let group = DispatchGroup()
group.enter()

// Handle permission check mode
if checkPermissions {
    manager.requestAccess { granted, error in
        if granted {
            print("✅ EventKit permissions granted")
            exit(0)
        } else {
            if let error = error {
                print("❌ EventKit permission denied: \(error.localizedDescription)")
            } else {
                print("❌ EventKit permission denied")
            }
            exit(1)
        }
        group.leave()
    }
    group.wait()
    // Keep the program running for a moment to allow async operations to complete
    RunLoop.main.run(until: Date(timeIntervalSinceNow: 1))
    exit(1)
}

// Request access to reminders
manager.requestAccess { granted, error in
    if granted {
        // Print all reminder lists
        print("=== REMINDER LISTS ===")
        let lists = manager.getAllReminderLists()
        for (index, list) in lists.enumerated() {
            print("\(index + 1). \(list.title)")
        }
        
        // Get and print all reminders
        group.enter()
        manager.getAllReminders(showCompleted: showCompleted) { reminders, error in
            if let error = error {
                print("Error fetching reminders: \(error.localizedDescription)")
            } else if let reminders = reminders {
                print("\n=== ALL REMINDERS ===")
                
                for reminder in reminders {
                    manager.printReminderDetails(reminder: reminder)
                }
            }
            group.leave()
        }
    } else {
        if let error = error {
            print("Failed to get access to reminders: \(error.localizedDescription)")
        } else {
            print("Failed to get access to reminders. Permission denied.")
        }
    }
    group.leave()
}

// Wait for all async operations to complete
group.wait()

// Keep the program running for a moment to allow async operations to complete
RunLoop.main.run(until: Date(timeIntervalSinceNow: 2)) 
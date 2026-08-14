//
//  DisplaySettingsModule.swift
//  Zero Lab
//
//  Created by Klay Lee on 2026/8/14.
//

import Foundation

/// The durable store behind `display-persistence`: a string-to-string map over `NSUserDefaults`,
/// knowing nothing about display settings.
///
/// `getSetting` returns synchronously rather than taking the callback the platform's own storage
/// example uses, because the JS side reads it while its state module is still being evaluated.
@objc(DisplaySettingsModule)
final class DisplaySettingsModule: NSObject, LynxModule {

    @objc static var name: String { "DisplaySettingsModule" }

    @objc static var methodLookup: [String: String] {
        [
            "getSetting": NSStringFromSelector(#selector(getSetting(_:))),
            "setSetting": NSStringFromSelector(#selector(setSetting(_:value:))),
        ]
    }

    // Swift has no optional initialiser requirements, so both of `LynxModule`'s `@optional`
    // ones have to be present or conformance fails. This module takes no param.
    override init() {
        super.init()
    }

    init(param: Any) {
        super.init()
    }

    /// Empty for a key never written — the JS side treats empty and absent alike.
    @objc func getSetting(_ key: String) -> String {
        UserDefaults.standard.string(forKey: key) ?? ""
    }

    @objc func setSetting(_ key: String, value: String) {
        UserDefaults.standard.set(value, forKey: key)

        // Documented as unnecessary for the ordinary case. This is not the ordinary case: a
        // force-quit right after a change gives the app no termination callback to flush in.
        UserDefaults.standard.synchronize()
    }
}

//
//  ViewController.swift
//  Zero Lab
//
//  Created by Klay Lee on 2026/8/7.
//

import UIKit

private class LocalBundleTemplateProvider: NSObject, LynxTemplateProvider {
    func loadTemplate(withUrl url: String!, onComplete callback: LynxTemplateLoadBlock!) {
        guard let path = Bundle.main.path(forResource: "main.lynx", ofType: "bundle") else {
            let error = NSError(domain: "com.zerolab", code: 404,
                                 userInfo: [NSLocalizedDescriptionKey: "main.lynx.bundle not found in app bundle."])
            callback(nil, error)
            return
        }
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            callback(data, nil)
        } catch {
            callback(nil, error as NSError)
        }
    }
}

class ViewController: UIViewController {

    private var lynxView: LynxView!
    private var didLoadTemplate = false

    override func viewDidLoad() {
        super.viewDidLoad()

        let config = LynxConfig(provider: LocalBundleTemplateProvider())
        config.registerUI(LynxUIInput.self, withName: "input")
        config.registerShadowNode(LynxUIInputShadowNode.self, withName: "input")
        config.registerUI(LynxUISVG.self, withName: "svg")
        config.register(DisplaySettingsModule.self)

        lynxView = LynxView { builder in
            builder.config = config
            builder.screenSize = self.view.bounds.size
            builder.fontScale = 1.0
        }
        lynxView.layoutWidthMode = .exact
        lynxView.layoutHeightMode = .exact
        lynxView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        view.addSubview(lynxView)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        // Pin to the safe area, not view.bounds, so the Dynamic Island / notch
        // doesn't clip the top of the page. Only known after layout, not viewDidLoad.
        let safeFrame = view.safeAreaLayoutGuide.layoutFrame
        lynxView.frame = safeFrame
        lynxView.preferredLayoutWidth = safeFrame.width
        lynxView.preferredLayoutHeight = safeFrame.height

        if !didLoadTemplate {
            didLoadTemplate = true
            lynxView.loadTemplate(fromURL: "main.lynx.bundle", initData: nil)
        }
    }
}


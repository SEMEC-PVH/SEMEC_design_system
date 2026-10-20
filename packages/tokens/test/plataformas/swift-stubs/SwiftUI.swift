// Stub de teste: só a assinatura de SwiftUI.Color que o SemecTokens.swift usa,
// copiada da documentação da Apple (Color.init(_:red:green:blue:opacity:)).
// Permite compilar o bloco `#if canImport(SwiftUI)` no Linux; não substitui o Xcode.
public struct Color {
  public enum RGBColorSpace { case sRGB, sRGBLinear, displayP3 }
  public init(_ colorSpace: RGBColorSpace = .sRGB, red: Double, green: Double, blue: Double, opacity: Double = 1) {}
}

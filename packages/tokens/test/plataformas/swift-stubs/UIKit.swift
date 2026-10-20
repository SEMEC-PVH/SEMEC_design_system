// Stub de teste: só a assinatura de UIKit.UIColor que o SemecTokens.swift usa,
// copiada da documentação da Apple (UIColor.init(red:green:blue:alpha:), em CGFloat).
// Permite compilar o bloco `#if canImport(UIKit)` no Linux; não substitui o Xcode.
import Foundation

open class UIColor {
  public init(red: CGFloat, green: CGFloat, blue: CGFloat, alpha: CGFloat) {}
}

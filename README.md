"Gesetzte Zahlen" soll durch "Geworfene Zahlen" ersetzt werden.
Ich möchte ein System zum testen implementieren:

Es wird gesetzt nach "Einsatz".
Falls eine der ausgewählten einfache Chance gewinnt, wird der Gewinn zum Einsatz hinzugefügt.
Es wird versucht eine einfache Chance 3-mal zu gewinnen.
Falls die einfache Chance 3-mal zu gewinnt, wird wieder der originale Einsatz gewählt.
Falls die einfache Chance verliert, wird einmalg versucht, mittels zweifachen Einsatz zu gewinnen.
Falls die einfache Chance danach wieder verliert, wird wieder der originale Einsatz gewählt.

Beispiel: Einsatz: 10. Angewählt sind bei  einfache Chance: Schwarz und 19–36.

Schwarz:
  Einsatz: 10
  geworfene Zahl: 29 (Gewinn)
  nächster Einsatz: 20
  geworfene Zahl: 13 (Gewinn)
  nächster Einsatz: 40
  geworfene Zahl: 35 (Gewinn)
  nächster Einsatz: 10 (3-maliger gewinn / reset Einsatz auf 10)

19–36:
  Einsatz: 10
  geworfene Zahl: 29 (Gewinn)
  nächster Einsatz: 20
  geworfene Zahl: 13 (Verlust)
  nächster Einsatz: 20 (doppelter einsatz: 10*2)
  geworfene Zahl: 35 (Gewinn)
  nächster Einsatz: 10 (reset Einsatz auf 10, auch bei Verlust wäre ein reset auf 10)


Ist das System so klar, oder brauchst du nochzusätzliche Informationen ?






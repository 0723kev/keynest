import { useEffect, useMemo, useState } from "react";
import { Button, Card, InputOTP, Slider } from "@heroui/react";
import { genTotp } from "@/utils/totp";

export default function TotpCard({
  secret,
  issuer,
  account,
  onCopy,
}: {
  secret: string;
  issuer?: string;
  account?: string;
  onCopy: (text: string, label: string) => void;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const data = useMemo(() => {
    try {
      return genTotp(secret, issuer, account);
    } catch {
      return null;
    }
  }, [secret, issuer, account, tick]);

  if (!data) {
    return (
      <Card className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>Invalid TOTP secret</Card.Title>
          <Card.Description>Shucks, punk</Card.Description>
        </Card.Header>
      </Card>
    );
  }
  return (
    <Card>
      <Card.Content>
        <div className="flex items-center justify-between gap-3">
          <div>
            {/* <Label className="mb-1">One-time code</Label> */}
            <InputOTP maxLength={data.code.length} value={data.code} readOnly>
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
              </InputOTP.Group>
              <InputOTP.Separator />
              <InputOTP.Group>
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
          </div>

          <Button onPress={() => onCopy(data.code, "otp")}>Copy</Button>
        </div>

        <div className="p-2 w-full rounded-full">
          <Slider
            minValue={0}
            maxValue={data.period}
            value={data.period - data.remaining}
          >
            {/* <Label>Refreshes in {data.remaining}s</Label> */}
            <Slider.Track>
              <Slider.Fill className="transition-all duration-500 ease-in-out" />
              <Slider.Thumb className="transition-all duration-500 ease-in-out w-0">
                <span className="text-tiny font-medium text-default-500 tabular-nums bg-default-100/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-default-200 shadow-sm">
                  {data.remaining}s
                </span>
              </Slider.Thumb>
            </Slider.Track>
          </Slider>
        </div>
      </Card.Content>
    </Card>
  );
}

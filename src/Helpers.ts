export function FireOnDomReady(func:Function)
{
	if (document.readyState === "complete")
	{
		func();
	}
	else
	{
		// @ts-ignore
		window.addEventListener("DOMContentLoaded", func);
	}
}
